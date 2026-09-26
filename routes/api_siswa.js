const express = require('express')
const app = express.Router()
const multer = require('multer')
const db = require('../config/database.js')
// const jwt = require('jsonwebtoken')
// const bcrypt = require('bcrypt')
// const auth = require('../middleware/auth.js')

// app.get('/:id', async (req, res) => {
//     try {
//         const { id } = req.params

//         const [rows] = await db.query(
//             'SELECT * FROM siswa WHERE id = ?',
//             [id]
//         )

//         if (rows.length === 0) {
//             return res.status(404).json({
//                 status: 'Error',
//                 message: 'User tidak ditemukan'
//             })
//         }

//         res.json({
//             status: 'Success',
//             message: 'Data user berhasil diambil',
//             data: rows[0]
//         })

//     } catch (error) {
//         console.error('Error get user:', error)

//         res.status(500).json({
//             status: 'Error',
//             message: 'Internal Server Error'
//         })
//     }
// })

app.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, nis, nama, kelas, alamat FROM siswa'
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

// app.post('/', async (req, res) => {
//     try {
//         const { nis, nama, kelas, alamat } = req.body

//         const [result] = await db.query(
//             'INSERT INTO siswa (nis, nama, kelas, alamat) VALUES (?, ?, ?, ?)',
//             [nis, nama, kelas, alamat]
//         )

//         res.status(201).json({
//             status: 'Success',
//             message: 'Data siswa berhasil ditambahkan',
//             data: {
//                 id: result.insertId,
//                 nis,
//                 nama,
//                 kelas,
//                 alamat
//             }
//         })

//     } catch (error) {
//         console.error('Error register siswa:', error)

//         res.status(500).json({
//             status: 'Error',
//             message: 'Internal Server Error'
//         })
//     }
// })

// app.put('/:id', async (req, res) => {
//     try {
//         const { id } = req.params
//         const { nis, nama, kelas, alamat } = req.body

//         const [result] = await db.query(
//             'UPDATE siswa SET nis = ?, nama = ?, kelas = ?, alamat = ? WHERE id = ?',
//             [nis, nama, kelas, alamat, id]
//         )

//         if (result.affectedRows === 0) {
//             return res.status(404).json({
//                 status: 'Error',
//                 message: 'Data siswa tidak ditemukan'
//             })
//         }

//         res.json({
//             status: 'Success',
//             message: 'Data siswa berhasil diubah',
//             data: {
//                 id,
//                 nis,
//                 nama,
//                 kelas,
//                 alamat
//             }
//         })

//     } catch (error) {
//         console.error('Error update siswa:', error)

//         res.status(500).json({
//             status: 'Error',
//             message: 'Internal Server Error'
//         })
//     }
// })

// app.patch('/:id', async (req, res) => {
//     try {
//         const { id } = req.params
//         const { nis, nama, kelas, alamat } = req.body

//         const [result] = await db.query(
//             `UPDATE siswa 
//              SET nis = COALESCE(?, nis),
//                  nama = COALESCE(?, nama),
//                  kelas = COALESCE(?, kelas),
//                  alamat = COALESCE(?, alamat)
//              WHERE id = ?`,
//             [nis, nama, kelas, alamat, id]
//         )

//         if (result.affectedRows === 0) {
//             return res.status(404).json({
//                 status: 'Error',
//                 message: 'Data siswa tidak ditemukan'
//             })
//         }

//         res.json({
//             status: 'Success',
//             message: 'Data siswa berhasil diperbarui'
//         })

//     } catch (error) {
//         console.error('Error patch siswa:', error)

//         res.status(500).json({
//             status: 'Error',
//             message: 'Internal Server Error'
//         })
//     }
// })

// app.delete('/:id', async (req, res) => {
//     try {
//         const { id } = req.params

//         // Ambil data siswa sebelum dihapus
//         const [rows] = await db.query(
//             'SELECT id, nis, nama, kelas, alamat FROM siswa WHERE id = ?',
//             [id]
//         )

//         if (rows.length === 0) {
//             return res.status(404).json({
//                 status: 'Error',
//                 message: 'Data siswa tidak ditemukan'
//             })
//         }

//         const siswa = rows[0]

//         // Hapus data siswa
//         await db.query(
//             'DELETE FROM siswa WHERE id = ?',
//             [id]
//         )

//         res.json({
//             status: 'Success',
//             message: 'Data siswa berhasil dihapus',
//             data: siswa
//         })

//     } catch (error) {
//         console.error('Error delete siswa:', error)

//         res.status(500).json({
//             status: 'Error',
//             message: 'Internal Server Error'
//         })
//     }
// })

module.exports = app