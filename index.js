const express = require('express')
const app = express()
const siswa = require('./routes/api_siswa')
const db = require('./config/database')
// const auth = require('./middleware/auth')
const multer = require('multer')
const upload = multer()
const path = require("path");

app.use(express.json())
app.use('/siswa', siswa)
app.use(express.static(path.join(__dirname, "public")));


app.listen(3000, () => {
  console.log('Web berhasil berjalan dijalankan https://localhost:3000')
})