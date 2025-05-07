export default function Header() {
    return (
      <header className="bg-primary-black text-primary-gold p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Soleil Hostel</h1>
          <button className="px-4 py-2 bg-primary-gold text-primary-black rounded">
            Đặt phòng ngay
          </button>
        </div>
      </header>
    )
  }