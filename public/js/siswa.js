const API_URL = '/siswa'

const siswaForm = document.getElementById('siswaForm')
const siswaTable = document.getElementById('siswaTable')

const siswaId = document.getElementById('siswaId')
const nis = document.getElementById('nis')
const nama = document.getElementById('nama')
const kelas = document.getElementById('kelas')
const alamat = document.getElementById('alamat')

const formTitle = document.getElementById('formTitle')
const submitButton = document.getElementById('submitButton')
const cancelButton = document.getElementById('cancelButton')

const loading = document.getElementById('loading')

const successMessage = document.getElementById('successMessage')
const errorMessage = document.getElementById('errorMessage')


// ===============================
// PESAN
// ===============================

function showSuccess(message) {
    successMessage.textContent = message
    successMessage.style.display = 'block'

    errorMessage.style.display = 'none'

    setTimeout(() => {
        successMessage.style.display = 'none'
    }, 3000)
}


function showError(message) {
    errorMessage.textContent = message
    errorMessage.style.display = 'block'

    successMessage.style.display = 'none'

    setTimeout(() => {
        errorMessage.style.display = 'none'
    }, 4000)
}


// ===============================
// LOADING
// ===============================

function showLoading() {
    loading.style.display = 'block'
}


function hideLoading() {
    loading.style.display = 'none'
}


// ===============================
// GET DATA SISWA
// ===============================

async function getSiswa() {

    showLoading()

    try {

        const response = await fetch(API_URL)

        if (!response.ok) {
            throw new Error('Gagal mengambil data siswa')
        }

        const result = await response.json()

        renderSiswa(result.data)

    } catch (error) {

        console.error(error)

        showError('Gagal mengambil data siswa')

    } finally {

        hideLoading()

    }
}


// ===============================
// TAMPILKAN DATA
// ===============================

function renderSiswa(data) {

    siswaTable.innerHTML = ''

    if (!data || data.length === 0) {

        siswaTable.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">
                    Belum ada data siswa
                </td>
            </tr>
        `

        return
    }

    data.forEach(siswa => {

        const row = document.createElement('tr')

        row.innerHTML = `
            <td>${siswa.id}</td>
            <td>${siswa.nis}</td>
            <td>${siswa.nama}</td>
            <td>${siswa.kelas}</td>
            <td>${siswa.alamat}</td>

            <td>
                <div class="actions">

                    <button
                        class="btn-edit"
                        onclick="editSiswa(${siswa.id})"
                    >
                        Edit
                    </button>

                    <button
                        class="btn-delete"
                        onclick="deleteSiswa(${siswa.id})"
                    >
                        Hapus
                    </button>

                </div>
            </td>
        `

        siswaTable.appendChild(row)

    })
}


// ===============================
// TAMBAH / EDIT
// ===============================

siswaForm.addEventListener('submit', async function (event) {

    event.preventDefault()

    const id = siswaId.value

    const data = {
        nis: Number(nis.value),
        nama: nama.value,
        kelas: kelas.value,
        alamat: alamat.value
    }

    try {

        let response

        // EDIT
        if (id) {

            response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })

        }

        // TAMBAH
        else {

            response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })

        }

        const result = await response.json()

        if (!response.ok) {
            throw new Error(result.message || 'Request gagal')
        }

        if (id) {
            showSuccess('Data siswa berhasil diperbarui')
        } else {
            showSuccess('Data siswa berhasil ditambahkan')
        }

        resetForm()

        getSiswa()

    } catch (error) {

        console.error(error)

        showError(error.message)

    }

})


// ===============================
// EDIT SISWA
// ===============================

async function editSiswa(id) {

    try {

        const response = await fetch(API_URL)

        if (!response.ok) {
            throw new Error('Gagal mengambil data siswa')
        }

        const result = await response.json()

        const siswa = result.data.find(item => item.id == id)

        if (!siswa) {
            showError('Data siswa tidak ditemukan')
            return
        }

        siswaId.value = siswa.id
        nis.value = siswa.nis
        nama.value = siswa.nama
        kelas.value = siswa.kelas
        alamat.value = siswa.alamat

        formTitle.textContent = 'Edit Siswa'
        submitButton.textContent = 'Simpan Perubahan'
        cancelButton.style.display = 'inline-block'

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })

    } catch (error) {

        console.error(error)

        showError('Gagal mengambil data siswa')

    }
}


// ===============================
// HAPUS SISWA
// ===============================

async function deleteSiswa(id) {

    const yakin = confirm(
        'Apakah kamu yakin ingin menghapus data siswa ini?'
    )

    if (!yakin) {
        return
    }

    try {

        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        })

        const result = await response.json()

        if (!response.ok) {
            throw new Error(result.message || 'Gagal menghapus data')
        }

        showSuccess('Data siswa berhasil dihapus')

        getSiswa()

    } catch (error) {

        console.error(error)

        showError(error.message)

    }
}


// ===============================
// RESET FORM
// ===============================

function resetForm() {

    siswaForm.reset()

    siswaId.value = ''

    formTitle.textContent = 'Tambah Siswa'

    submitButton.textContent = 'Tambah Siswa'

    cancelButton.style.display = 'none'
}


// ===============================
// TOMBOL BATAL
// ===============================

cancelButton.addEventListener('click', function () {

    resetForm()

})


// ===============================
// LOAD AWAL
// ===============================

getSiswa()