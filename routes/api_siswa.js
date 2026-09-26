const express = require('express')
const app = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const db = require('../config/database.js')
// const jwt = require('jsonwebtoken')
// const bcrypt = require('bcrypt')
// const auth = require('../middleware/auth.js')

// ===============================
// UPLOAD FOTO SISWA
// ===============================

const uploadDir = path.join(__dirname, '../public/uploads/siswa')

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
        cb(null, uniqueName)
    }
})

function fileFilter(req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true)
    } else {
        cb(new Error('File harus berupa gambar'))
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // maksimal 2MB
})

// Bungkus upload.single supaya error multer (tipe/ukuran file salah)
// dikirim sebagai JSON, bukan error HTML default Express
function uploadFoto(req, res, next) {
    upload.single('foto')(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                status: 'Error',
                message: err.message || 'Upload foto gagal'
            })
        }
        next()
    })
}

// Hapus file foto lama dari disk (dipakai saat update/delete siswa)
function hapusFileFoto(fotoPath) {
    if (!fotoPath) return
    const fullPath = path.join(__dirname, '../public', fotoPath)
    fs.unlink(fullPath, () => {}) // diamkan kalau file tidak ada
}

// Route ini HARUS didefinisikan sebelum GET /:id, kalau tidak
// Express akan menganggap "search" sebagai nilai :id
app.get('/search', async (req, res) => {
    try {
        const { search, kelas } = req.query

        let query = 'SELECT id, nis, nama, kelas, alamat, foto FROM siswa WHERE 1=1'
        const params = []

        if (search) {
            const keyword = `%${search}%`
            query += ' AND (nama LIKE ? OR CAST(nis AS CHAR) LIKE ? OR alamat LIKE ?)'
            params.push(keyword, keyword, keyword)
        }

        if (kelas) {
            query += ' AND kelas = ?'
            params.push(kelas)
        }

        query += ' ORDER BY nama ASC'

        const [rows] = await db.query(query, params)

        res.json({
            status: 'Success',
            message: 'Data siswa berhasil diambil',
            data: rows
        })

    } catch (error) {
        console.error('Error search siswa:', error)

        res.status(500).json({
            status: 'Error',
            message: 'Internal Server Error'
        })
    }
})

app.get('/:id', async (req, res) => {
    try {
        const { id } = req.params

        const [rows] = await db.query(
            'SELECT * FROM siswa WHERE id = ?',
            [id]
        )

        if (rows.length === 0) {
            return res.status(404).json({
                status: 'Error',
                message: 'User tidak ditemukan'
            })
        }

        res.json({
            status: 'Success',
            message: 'Data user berhasil diambil',
            data: rows[0]
        })

    } catch (error) {
        console.error('Error get user:', error)

        res.status(500).json({
            status: 'Error',
            message: 'Internal Server Error'
        })
    }
})

app.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, nis, nama, kelas, alamat, foto FROM siswa'
        )

        res.json({
            status: 'Success',
            message: 'Data siswa berhasil diambil',
            data: rows
        })

    } catch (error) {
        console.error('Error get siswa:', error)

        res.status(500).json({
            status: 'Error',
            message: 'Internal Server Error'
        })
    }
})

app.post('/', uploadFoto, async (req, res) => {
    try {
        const { nis, nama, kelas, alamat } = req.body
        const foto = req.file ? `uploads/siswa/${req.file.filename}` : null

        const [result] = await db.query(
            'INSERT INTO siswa (nis, nama, kelas, alamat, foto) VALUES (?, ?, ?, ?, ?)',
            [nis, nama, kelas, alamat, foto]
        )

        res.status(201).json({
            status: 'Success',
            message: 'Data siswa berhasil ditambahkan',
            data: {
                id: result.insertId,
                nis,
                nama,
                kelas,
                alamat,
                foto
            }
        })

    } catch (error) {
        console.error('Error register siswa:', error)

        res.status(500).json({
            status: 'Error',
            message: 'Internal Server Error'
        })
    }
})

app.put('/:id', uploadFoto, async (req, res) => {
    try {
        const { id } = req.params
        const { nis, nama, kelas, alamat } = req.body

        const [existingRows] = await db.query(
            'SELECT foto FROM siswa WHERE id = ?',
            [id]
        )

        if (existingRows.length === 0) {
            return res.status(404).json({
                status: 'Error',
                message: 'Data siswa tidak ditemukan'
            })
        }

        let foto = existingRows[0].foto

        // Kalau ada file baru diupload, hapus foto lama dan pakai yang baru
        if (req.file) {
            hapusFileFoto(foto)
            foto = `uploads/siswa/${req.file.filename}`
        }

        const [result] = await db.query(
            'UPDATE siswa SET nis = ?, nama = ?, kelas = ?, alamat = ?, foto = ? WHERE id = ?',
            [nis, nama, kelas, alamat, foto, id]
        )

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'Error',
                message: 'Data siswa tidak ditemukan'
            })
        }

        res.json({
            status: 'Success',
            message: 'Data siswa berhasil diubah',
            data: {
                id,
                nis,
                nama,
                kelas,
                alamat,
                foto
            }
        })

    } catch (error) {
        console.error('Error update siswa:', error)

        res.status(500).json({
            status: 'Error',
            message: 'Internal Server Error'
        })
    }
})

app.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { nis, nama, kelas, alamat } = req.body

        const [result] = await db.query(
            `UPDATE siswa 
             SET nis = COALESCE(?, nis),
                 nama = COALESCE(?, nama),
                 kelas = COALESCE(?, kelas),
                 alamat = COALESCE(?, alamat)
             WHERE id = ?`,
            [nis, nama, kelas, alamat, id]
        )

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'Error',
                message: 'Data siswa tidak ditemukan'
            })
        }

        // Ambil data terbaru setelah di-update
        const [rows] = await db.query(
            `SELECT id, nis, nama, kelas, alamat
             FROM siswa
             WHERE id = ?`,
            [id]
        )

        res.json({
            status: 'Success',
            message: 'Data siswa berhasil diperbarui',
            data: rows[0]
        })

    } catch (error) {
        console.error('Error patch siswa:', error)

        res.status(500).json({
            status: 'Error',
            message: 'Internal Server Error'
        })
    }
})

app.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params

        // Ambil data siswa sebelum dihapus
        const [rows] = await db.query(
            'SELECT id, nis, nama, kelas, alamat, foto FROM siswa WHERE id = ?',
            [id]
        )

        if (rows.length === 0) {
            return res.status(404).json({
                status: 'Error',
                message: 'Data siswa tidak ditemukan'
            })
        }

        const siswa = rows[0]

        // Hapus data siswa
        await db.query(
            'DELETE FROM siswa WHERE id = ?',
            [id]
        )

        hapusFileFoto(siswa.foto)

        res.json({
            status: 'Success',
            message: 'Data siswa berhasil dihapus',
            data: siswa
        })

    } catch (error) {
        console.error('Error delete siswa:', error)

        res.status(500).json({
            status: 'Error',
            message: 'Internal Server Error'
        })
    }
})

module.exports = app