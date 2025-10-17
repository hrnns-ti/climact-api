# API Documentation - Quest Harian/Mingguan

## Overview
API RESTful untuk sistem quest harian dan mingguan dengan autentikasi JWT. Sistem ini mendukung gamifikasi dengan fitur progress tracking, validasi periode, dan keamanan kepemilikan data.

## Base URL
```
http://localhost:5500
```

## Autentikasi
Semua endpoint (kecuali register & login) membutuhkan JWT token di header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. Authentication

#### Register
Mendaftarkan user baru.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

**Response:**
- **201 Created** - User berhasil didaftarkan
- **400 Bad Request** - Data tidak valid atau username sudah ada

---

#### Login
Melakukan login dan mendapatkan JWT token.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

**Response:**
- **200 OK**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
- **401 Unauthorized** - Username atau password salah

---

### 2. Quest Master (Admin)

#### Get All Quests
Mengambil semua quest yang tersedia.

**Endpoint:** `GET /quests`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Cuci Tangan",
    "description": "Cuci tangan minimal 20 detik",
    "points": 10,
    "category": "daily",
    "target": 5,
    "deadline": "2025-10-20T23:59:59"
  }
]
```

---

#### Create Quest
Membuat quest baru (admin).

**Endpoint:** `POST /quests`

**Request Body:**
```json
{
  "name": "Olahraga Mingguan",
  "description": "Olahraga minimal 3x seminggu",
  "points": 30,
  "category": "weekly",
  "target": 3,
  "deadline": "2025-10-20T23:59:59"
}
```

**Field Explanation:**
- `name` (required): Nama quest
- `description` (required): Deskripsi quest
- `points` (required): Poin yang didapat jika complete
- `category` (required): `"daily"` atau `"weekly"`
- `target` (required): Jumlah progress untuk complete
- `deadline` (optional): Batas waktu quest (ISO 8601)

**Response:**
- **201 Created** - Quest berhasil dibuat
- **400 Bad Request** - Data tidak valid

---

#### Update Quest
Mengubah data quest.

**Endpoint:** `PATCH /quests/:id`

**Request Body:** (isi field yang ingin diubah)
```json
{
  "target": 10
}
```

**Response:**
- **200 OK** - Quest berhasil diupdate
- **404 Not Found** - Quest tidak ditemukan

---

#### Delete Quest
Menghapus quest.

**Endpoint:** `DELETE /quests/:id`

**Response:**
- **200 OK** - Quest berhasil dihapus
- **404 Not Found** - Quest tidak ditemukan

---

### 3. User Quest (Quest Instance per User)

#### Start Quest
Memulai quest untuk user.

**Endpoint:** `POST /userquest/start`

**Request Body:**
```json
{
  "quest_id": 3,
  "periode": "2024-07-01"
}
```

**Periode Format:**
- **Daily:** `YYYY-MM-DD` (contoh: `"2024-07-01"`)
- **Weekly:** `YYYY-Wxx` (contoh: `"2024-W28"`)

**Response:**
- **201 Created**
```json
{
  "id": 5,
  "user_id": 1,
  "quest_id": 3,
  "periode": "2024-07-01",
  "progress": 0,
  "completed": 0
}
```
- **400 Bad Request** - Periode tidak valid
- **404 Not Found** - Quest tidak ditemukan
- **409 Conflict** - Quest sudah dijalankan di periode ini

---

#### Get User Quests
Mengambil semua quest user yang sedang login.

**Endpoint:** `GET /userquest`

**Query Parameters (optional):**
- `periode` - Filter berdasarkan periode (contoh: `?periode=2024-07-01`)

**Response:**
```json
[
  {
    "id": 5,
    "user_id": 1,
    "quest_id": 3,
    "periode": "2024-07-01",
    "progress": 3,
    "completed": 0,
    "finished": null
  },
  {
    "id": 6,
    "user_id": 1,
    "quest_id": 4,
    "periode": "2024-W28",
    "progress": 3,
    "completed": 1,
    "finished": "2024-07-01T12:34:56"
  }
]
```

**Field Explanation:**
- `completed`: `1` jika sudah selesai, `0` jika belum
- `finished`: Waktu selesai quest (ISO 8601) jika sudah complete, `null` jika belum

---

#### Update Quest Progress
Menambah progress quest user.

**Endpoint:** `PATCH /userquest/:id/progress`

**Request Body:**
```json
{
  "increment": 1
}
```

**Field Explanation:**
- `increment` (optional): Jumlah progress yang ditambahkan (default: 1)

**Response:**
- **200 OK**
```json
{
  "message": "Progress updated",
  "progress": 4,
  "completed": false
}
```
atau jika sudah complete:
```json
{
  "message": "Quest completed!",
  "progress": 5,
  "completed": true
}
```
- **400 Bad Request** - Quest sudah complete atau periode tidak valid
- **403 Forbidden** - Bukan pemilik quest
- **404 Not Found** - Quest tidak ditemukan

---

#### Complete Quest Manual
Menandai quest sebagai complete secara manual.

**Endpoint:** `PATCH /userquest/:id/complete`

**Response:**
- **200 OK**
```json
{
  "message": "Quest marked as completed"
}
```
- **400 Bad Request** - Periode tidak valid atau deadline lewat
- **403 Forbidden** - Bukan pemilik quest
- **404 Not Found** - Quest tidak ditemukan

---

## Validasi & Keamanan

### Ownership Check
- Semua endpoint `/userquest/:id/...` hanya bisa diakses oleh pemilik quest user.
- Jika user mencoba akses quest milik orang lain, akan mendapat **403 Forbidden**.

### Validasi Periode
- Quest hanya bisa di-start, di-progress, dan di-complete pada periode yang sesuai:
  - **Daily:** Hanya bisa dikerjakan di hari yang sama dengan periode
  - **Weekly:** Hanya bisa dikerjakan di minggu yang sama dengan periode
- Jika periode tidak sesuai, akan mendapat **400 Bad Request**.

### Validasi Lainnya
- Tidak bisa start quest yang sama dua kali di periode yang sama (409 Conflict)
- Tidak bisa progress quest yang sudah complete (400 Bad Request)
- Progress otomatis menjadi complete jika mencapai target
- Jika ada deadline, tidak bisa progress/complete setelah deadline lewat

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request berhasil |
| 201 | Created - Data berhasil dibuat |
| 400 | Bad Request - Data tidak valid |
| 401 | Unauthorized - Token tidak valid/expired |
| 403 | Forbidden - Tidak memiliki akses ke resource |
| 404 | Not Found - Data tidak ditemukan |
| 409 | Conflict - Data sudah ada |
| 500 | Internal Server Error - Error server |

---

## Error Response Format

Semua error akan mengembalikan format JSON:
```json
{
  "error": "Deskripsi error"
}
```

---

## Testing dengan Thunder Client / Postman

### Setup
1. Import collection atau buat request baru
2. Set base URL: `http://localhost:5500`
3. Login untuk mendapat token
4. Set header `Authorization: Bearer <token>` untuk endpoint yang membutuhkan autentikasi

### Test Flow
1. Register user baru
2. Login dan simpan token
3. Buat quest baru (admin)
4. Start quest dengan periode yang valid
5. Progress quest dengan increment
6. Cek apakah quest otomatis complete saat mencapai target
7. Test keamanan: coba akses quest milik user lain (harus 403)

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "better-sqlite3": "^8.5.0",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "date-fns": "^2.30.0"
}
```

---

## Environment Variables

Buat file `.env` di root project:
```
PORT=5500
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=1d
```

---

## Database Schema

### Table: users
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);
```

### Table: quest
```sql
CREATE TABLE quest (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 0,
  category TEXT CHECK(category IN ('daily', 'weekly')),
  target INTEGER DEFAULT 1,
  deadline TEXT
);
```

### Table: user_quests
```sql
CREATE TABLE user_quests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  quest_id INTEGER NOT NULL,
  periode TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0,
  finished TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (quest_id) REFERENCES quest(id),
  UNIQUE(user_id, quest_id, periode)
);
```

---

## Notes

1. Token JWT berlaku selama 1 hari (bisa diubah di `.env`)
2. Password di-hash menggunakan bcrypt sebelum disimpan
3. Periode daily menggunakan format `YYYY-MM-DD`, weekly menggunakan `YYYY-Wxx`
4. Validasi periode menggunakan library `date-fns`
5. Semua endpoint sudah dilindungi dengan JWT middleware kecuali register & login

---

## Future Enhancements

- [ ] Leaderboard
- [ ] Badge/Achievement
- [ ] Quest statistics
- [ ] Reward system
- [ ] Notification system
- [ ] Quest categories expansion
- [ ] Quest recommendation

---

## License

MIT

---

## Contact

Untuk pertanyaan atau bug report, silakan buat issue di GitHub repository.