// RoomList component: Hiển thị danh sách phòng từ API, xử lý loading/error, responsive grid với Tailwind
import React, { useEffect, useState } from 'react'
import api from '../services/api' // Axios instance với baseURL đã cấu hình

// Định nghĩa type cho response của API
interface Room {
  id: number
  name: string
  price: number
  max_guests: number
  status: string
}

interface RoomApiResponse {
  data: Room[]
  message?: string
  [key: string]: unknown
}

// Skeleton loading cho UX tốt hơn
const RoomSkeleton: React.FC = () => (
  <div className="bg-gray-100 rounded-xl shadow-lg p-6 animate-pulse flex flex-col justify-between">
    <div>
      <div className="h-6 bg-gray-300 rounded w-2/3 mb-2" />
      <div className="h-4 bg-gray-300 rounded w-1/2 mb-1" />
      <div className="h-4 bg-gray-300 rounded w-1/3 mb-1" />
      <div className="h-6 bg-gray-300 rounded w-1/4 mt-2" />
    </div>
  </div>
)

// Tách card phòng thành component riêng
interface RoomCardProps {
  room: Room
}

const RoomCard: React.FC<RoomCardProps> = ({ room }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col justify-between hover:scale-105 transition-transform duration-200">
    <div>
      {/* Tên phòng */}
      <h3 className="text-xl font-semibold mb-2 text-blue-600">{room.name}</h3>
      {/* Giá phòng */}
      <p className="mb-1 text-gray-700">
        Price: <span className="font-bold text-green-600">${room.price}</span>
      </p>
      {/* Số khách tối đa */}
      <p className="mb-1 text-gray-700">
        Max Guests: <span className="font-bold">{room.max_guests}</span>
      </p>
      {/* Trạng thái phòng với màu sắc động */}
      <p
        className={
          `inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ` +
          (room.status === 'available'
            ? 'bg-green-100 text-green-700'
            : room.status === 'booked'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700')
        }
      >
        {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
      </p>
    </div>
  </div>
)

// Định nghĩa kiểu dữ liệu cho một phòng
interface Room {
  id: number
  name: string
  price: number
  max_guests: number
  status: string
}

const RoomList: React.FC = () => {
  // State lưu danh sách phòng
  const [rooms, setRooms] = useState<Room[]>([])
  // State loading khi đang fetch dữ liệu
  const [loading, setLoading] = useState(true)
  // State lưu thông báo lỗi nếu có
  const [error, setError] = useState<string | null>(null)

  // Chuẩn bị cho phân trang/lazy loading (có thể mở rộng sau)
  // const [page, setPage] = useState(1);
  // const [hasMore, setHasMore] = useState(true);

  // Fetch danh sách phòng khi component mount
  useEffect(() => {
    api
      .get<RoomApiResponse>('/rooms')
      .then(res => {
        setRooms(res.data.data || [])
        setLoading(false)
      })
      .catch(err => {
        // Nếu API trả về lỗi chi tiết, hiển thị lỗi cụ thể
        const msg = err?.response?.data?.message || err.message || 'Failed to fetch rooms'
        setError(msg)
        setLoading(false)
      })
  }, [])

  // Hiển thị trạng thái loading với skeleton
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 text-blue-700">Available Rooms</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, idx) => (
            <RoomSkeleton key={idx} />
          ))}
        </div>
      </div>
    )
  }

  // Hiển thị trạng thái lỗi
  if (error) {
    return <div className="text-center py-10 text-lg text-red-600">{error}</div>
  }

  // Hiển thị danh sách phòng dạng grid responsive
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Tiêu đề danh sách phòng */}
      <h2 className="text-2xl font-bold mb-6 text-blue-700">Available Rooms</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {/* Lặp qua từng phòng và hiển thị thông tin */}
        {rooms.map(room => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
      {/* Phân trang/lazy loading: có thể bổ sung nút hoặc infinite scroll ở đây */}
    </div>
  )
}

export default RoomList
