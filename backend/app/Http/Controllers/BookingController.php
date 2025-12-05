<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Room;
use App\Http\Requests\StoreBookingRequest;
use App\Http\Requests\UpdateBookingRequest;
use App\Http\Resources\BookingResource;
use App\Events\BookingUpdated;
use App\Events\BookingDeleted;
use App\Services\CreateBookingService;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class BookingController extends Controller
{
    public function __construct(
        private CreateBookingService $bookingService
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $bookings = Booking::withCommonRelations()
            ->where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => BookingResource::collection($bookings)
        ]);
    }

    /**
     * Store a newly created resource in storage.
     * 
     * Dùng CreateBookingService để đảm bảo không double-booking
     * Service sẽ handle transaction + pessimistic locking + retry logic
     * 
     * INPUT SANITIZATION:
     * - FormRequest validation sẽ reject invalid input
     * - Booking model trait sẽ auto-purify guest_name (HTML Purifier, không regex)
     * - Regex blacklist = 99% bypass. HTML Purifier = 0% bypass.
     */
    public function store(StoreBookingRequest $request): JsonResponse
    {
        $validated = $request->validated();

        try {
            // Gọi service để tạo booking (có pessimistic locking)
            $booking = $this->bookingService->create(
                roomId: $validated['room_id'],
                checkIn: $validated['check_in'],
                checkOut: $validated['check_out'],
                guestName: $validated['guest_name'],
                guestEmail: $validated['guest_email'],
                userId: auth()->id(),
                additionalData: []
            );

            return response()->json([
                'success' => true,
                'message' => 'Booking created successfully',
                'data' => new BookingResource($booking->load('room')),
            ], 201);
        } catch (RuntimeException $e) {
            // Xử lý lỗi từ service (phòng đặt, không tồn tại, v.v.)
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Throwable $e) {
            // Log error nếu cần
            \Log::error('Booking creation failed: ' . $e->getMessage(), [
                'user_id' => auth()->id(),
                'room_id' => $validated['room_id'] ?? null,
                'exception' => class_basename($e),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating the booking. Please try again.',
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Booking $booking): JsonResponse
    {
        // Kiểm tra authorization dùng policy
        $this->authorize('view', $booking);

        return response()->json([
            'success' => true,
            'data' => $booking->load('room')
        ]);
    }

    /**
     * Update the specified resource in storage.
     * 
     * Dùng CreateBookingService để update, đảm bảo không overlap
     */
    public function update(UpdateBookingRequest $request, Booking $booking): JsonResponse
    {
        // Kiểm tra authorization
        $this->authorize('update', $booking);

        $validated = $request->validated();

        try {
            // Store original booking for event
            $originalBooking = $booking->replicate();

            // Gọi service update
            $booking = $this->bookingService->update(
                booking: $booking,
                checkIn: $validated['check_in'],
                checkOut: $validated['check_out'],
                additionalData: []
            );

            // Dispatch event for cache invalidation
            BookingUpdated::dispatch($booking, $originalBooking);

            return response()->json([
                'success' => true,
                'message' => 'Booking updated successfully',
                'data' => new BookingResource($booking->load('room')),
            ]);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Throwable $e) {
            \Log::error('Booking update failed: ' . $e->getMessage(), [
                'booking_id' => $booking->id,
                'exception' => class_basename($e),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating the booking.',
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Booking $booking): JsonResponse
    {
        // Kiểm tra authorization
        $this->authorize('delete', $booking);

        // Store booking data for event before deleting
        $deletedBooking = $booking->replicate();

        $booking->delete();

        // Dispatch event for cache invalidation
        BookingDeleted::dispatch($deletedBooking);

        return response()->json([
            'success' => true,
            'message' => 'Booking deleted successfully',
        ], 204);
    }
}

