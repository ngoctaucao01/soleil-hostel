# Frontend development (Vite + React)

Quick steps to run the frontend with HMR and have Laravel serve the app during development.

1. Install dependencies

```powershell
cd C:\Users\Admin\myProject\soleil-hostel\frontend
npm install
```

2. Start the dev server (this auto-writes `backend/public/hot` so Laravel uses HMR)

```powershell
npm run dev
```

- `predev` script writes the hot file (`backend/public/hot`) to point at `http://localhost:3000`.
- `postdev` removes that hot file when the process exits.

3. Start Laravel (separate terminal)

```powershell
cd C:\Users\Admin\myProject\soleil-hostel\backend
php artisan serve --host=127.0.0.1 --port=8000
```

4. Open the app at http://127.0.0.1:8000

Notes
- If you change `vite.config.ts` server port, update `frontend/scripts/write-hot.js` to match.
- If permissions prevent writing `backend/public/hot`, run PowerShell as Admin or give write permissions to the directory.
- For production build, run `npm run build` and Laravel will serve the static assets from `backend/public/build`.
