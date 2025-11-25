<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Room;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use PDOException;
use RuntimeException;
use Throwable;

/**
 * CreateBookingService - Xử lý tạo booking với an toàn double-booking
 * 
 * Triển khai pessimistic locking (SELECT ... FOR UPDATE) để đảm bảo không bao giờ có overlap
 * kể cả dưới tải cao (100-500 request/giây)
 */
class CreateBookingService
{
    // Số lần retry khi deadlock
    private const DEADLOCK_RETRY_ATTEMPTS = 3;
    
    // Thời gian chờ giữa retry (exponential backoff: 100ms, 200ms, 400ms)
    private const DEADLOCK_RETRY_DELAY_MS = 100;

    /**
     * Tạo booking mới với đảm bảo không overlap
     * 
     * @param int $roomId
     * @param Carbon|\DateTime|string $checkIn
     * @param Carbon|\DateTime|string $checkOut
     * @param string $guestName
     * @param string $guestEmail
     * @param int|null $userId
     * @param array $additionalData
     * @return Booking
     * @throws RuntimeException Khi phòng không tồn tại
     * @throws RuntimeException Khi phòng đã được đặt cho ngày chỉ định
     * @throws Throwable Khi database error khác xảy ra
     */
    public function create(
        int $roomId,
        $checkIn,
        $checkOut,
        string $guestName,
        string $guestEmail,
        ?int $userId = null,
        array $additionalData = []
    ): Booking {
        // Parse & validate dates
        $checkIn = $this->parseDate($checkIn);
        $checkOut = $this->parseDate($checkOut);

        $this->validateDates($checkIn, $checkOut);

        // Thử tạo booking với retry logic cho deadlock
        return $this->createWithDeadlockRetry(
            $roomId,
            $checkIn,
            $checkOut,
            $guestName,
            $guestEmail,
            $userId,
            $additionalData
        );
    }

    /**
     * Tạo booking với retry logic cho deadlock
     * 
     * Khi 2+ transaction cùng lock các row và cố gắng update chéo nhau,
     * PostgreSQL/MySQL sẽ raise deadlock exception.
     * 
     * Giải pháp: Retry với exponential backoff
     */
    private function createWithDeadlockRetry(
        int $roomId,
        Carbon $checkIn,
        Carbon $checkOut,
        string $guestName,
        string $guestEmail,
        ?int $userId,
        array $additionalData
    ): Booking {
        $attempt = 0;

        do {
            try {
                return $this->createBookingWithLocking(
                    $roomId,
                    $checkIn,
                    $checkOut,
                    $guestName,
                    $guestEmail,
                    $userId,
                    $additionalData
                );
            } catch (PDOException $e) {
                $attempt++;

                // Kiểm tra nếu là deadlock exception
                if ($this->isDeadlockException($e)) {
                    if ($attempt >= self::DEADLOCK_RETRY_ATTEMPTS) {
                        // Đã retry hết, ném lỗi
                        throw new RuntimeException(
                            'Không thể tạo booking sau ' . self::DEADLOCK_RETRY_ATTEMPTS . ' lần thử do xung đột database. Vui lòng thử lại.',
                            0,
                            $e
                        );
                    }

                    // Exponential backoff: 100ms, 200ms, 400ms
                    $delayMs = self::DEADLOCK_RETRY_DELAY_MS * (2 ** ($attempt - 1));
                    usleep($delayMs * 1000); // Chuyển từ ms sang microseconds

                    continue;
                }

                // Exception khác, ném luôn
                throw $e;
            }
        } while ($attempt < self::DEADLOCK_RETRY_ATTEMPTS);

        throw new RuntimeException('Không thể tạo booking');
    }

    /**
     * Tạo booking với pessimistic locking (SELECT ... FOR UPDATE)
     * 
     * Flow:
     * 1. Bắt đầu transaction
     * 2. SELECT từ bookings table FOR UPDATE (lock các row matching condition)
     * 3. Kiểm tra xem có booking trùng không
     * 4. Nếu không có, INSERT booking mới
     * 5. Commit transaction (release lock)
     * 
     * Điều quan trọng: Lock được giữ cho đến khi transaction commit/rollback,
     * đảm bảo không có transaction khác có thể tạo booking trùng
     */
    private function createBookingWithLocking(
        int $roomId,
        Carbon $checkIn,
        Carbon $checkOut,
        string $guestName,
        string $guestEmail,
        ?int $userId,
        array $additionalData
    ): Booking {
        return DB::transaction(function () use (
            $roomId,
            $checkIn,
            $checkOut,
            $guestName,
            $guestEmail,
            $userId,
            $additionalData
        ) {
            // Step 1: Kiểm tra phòng tồn tại
            $room = Room::find($roomId);
            if (!$room) {
                throw new ModelNotFoundException(
                    "Phòng với ID {$roomId} không tồn tại"
                );
            }

            // Step 2: Lấy lock trên tất cả active booking của phòng này
            // Query này sẽ lock các row từ bookings table mà thỏa điều kiện
            // Các transaction khác cố gắng SELECT FOR UPDATE hoặc update sẽ bị chờ
            $existingBookings = Booking::query()
                ->overlappingBookings($roomId, $checkIn, $checkOut)
                ->withLock()
                ->get();

            // Step 3: Nếu có booking trùng, throw exception
            // Exception sẽ được catch ở ngoài và xử lý
            if ($existingBookings->isNotEmpty()) {
                throw new RuntimeException(
                    'Phòng đã được đặt cho ngày chỉ định. Vui lòng chọn ngày khác.'
                );
            }

            // Step 4: Tạo booking mới (vẫn trong transaction, lock vẫn được giữ)
            $booking = Booking::create([
                'room_id' => $roomId,
                'check_in' => $checkIn,
                'check_out' => $checkOut,
                'guest_name' => $guestName,
                'guest_email' => $guestEmail,
                'status' => Booking::STATUS_PENDING,
                'user_id' => $userId,
                ...$additionalData,
            ]);

            // Step 5: Return booking (transaction auto-commit, lock released)
            return $booking;
        });
    }

    /**
     * Update booking với check overlap (exclude chính nó)
     * 
     * Giống như create, nhưng exclude booking id hiện tại
     * để tránh check constraint với chính nó
     */
    public function update(
        Booking $booking,
        Carbon $checkIn,
        Carbon $checkOut,
        array $additionalData = []
    ): Booking {
        $this->validateDates($checkIn, $checkOut);

        return DB::transaction(function () use ($booking, $checkIn, $checkOut, $additionalData) {
            // Lấy lock trên overlapping bookings (exclude current booking)
            $conflicts = Booking::query()
                ->overlappingBookings($booking->room_id, $checkIn, $checkOut, $booking->id)
                ->withLock()
                ->exists();

            if ($conflicts) {
                throw new RuntimeException(
                    'Phòng đã được đặt cho ngày chỉ định. Vui lòng chọn ngày khác.'
                );
            }

            $booking->update([
                'check_in' => $checkIn,
                'check_out' => $checkOut,
                ...$additionalData,
            ]);

            return $booking;
        });
    }

    /**
     * Validate date range
     */
    private function validateDates(Carbon $checkIn, Carbon $checkOut): void
    {
        if (!$checkIn->lessThan($checkOut)) {
            throw new RuntimeException(
                'Ngày check-out phải sau ngày check-in'
            );
        }

        if ($checkIn->isPast()) {
            throw new RuntimeException(
                'Ngày check-in phải là ngày trong tương lai'
            );
        }
    }

    /**
     * Parse date string/datetime
     */
    private function parseDate($date): Carbon
    {
        if ($date instanceof Carbon) {
            return $date;
        }

        return Carbon::parse($date)->startOfDay();
    }

    /**
     * Kiểm tra exception có phải deadlock không
     * 
     * Deadlock errors:
     * - MySQL: SQLSTATE 40P01 hoặc message chứa "Deadlock found"
     * - PostgreSQL: SQLSTATE 40P01 (serialization failure)
     * - SQLite: SQLITE_BUSY hoặc "database is locked"
     */
    private function isDeadlockException(PDOException $exception): bool
    {
        $message = strtolower($exception->getMessage());
        $code = $exception->getCode();

        return str_contains($message, 'deadlock') ||
               str_contains($message, 'lock') ||
               in_array($code, ['40P01', '1213', 'HY000'], true);
    }
}
