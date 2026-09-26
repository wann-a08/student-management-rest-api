const API_URL = '/siswa'
const PAGE_SIZE = 5

const siswaForm = document.getElementById('siswaForm')
const siswaTable = document.getElementById('siswaTable')

const siswaId = document.getElementById('siswaId')
const nis = document.getElementById('nis')
const nama = document.getElementById('nama')
const kelas = document.getElementById('kelas')
const alamat = document.getElementById('alamat')
const foto = document.getElementById('foto')
const fotoPreviewWrap = document.getElementById('fotoPreviewWrap')
const fotoPreview = document.getElementById('fotoPreview')

const nisError = document.getElementById('nisError')
const namaError = document.getElementById('namaError')
const kelasError = document.getElementById('kelasError')
const alamatError = document.getElementById('alamatError')
const fotoError = document.getElementById('fotoError')

const formTitle = document.getElementById('formTitle')
const submitButton = document.getElementById('submitButton')
const cancelButton = document.getElementById('cancelButton')

const loading = document.getElementById('loading')

const successMessage = document.getElementById('successMessage')
const errorMessage = document.getElementById('errorMessage')

const confirmModal = document.getElementById('confirmModal')
const confirmModalText = document.getElementById('confirmModalText')
const confirmCancelBtn = document.getElementById('confirmCancelBtn')
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn')

const searchInput = document.getElementById('searchInput')
const kelasFilter = document.getElementById('kelasFilter')
const paginationInfo = document.getElementById('paginationInfo')
const prevPageBtn = document.getElementById('prevPageBtn')
const nextPageBtn = document.getElementById('nextPageBtn')

const themeToggle = document.getElementById('themeToggle')

// Menyimpan seluruh data siswa dari server, dipakai untuk isi dropdown
// kelas dan sebagai fallback saat tidak ada search/filter aktif
let allSiswa = []
// Hasil dari GET /siswa/search (atau sama dengan allSiswa kalau tidak ada filter)
let currentResult = []
let currentPage = 1
let searchDebounceTimer = null


// ===============================
// DARK / LIGHT MODE
// ===============================

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme)
    themeToggle.textContent = theme === 'light' ? '🌙' : '☀️'
    localStorage.setItem('siswa-theme', theme)
}

themeToggle.addEventListener('click', function () {
    const current = document.documentElement.getAttribute('data-theme') || 'dark'
    applyTheme(current === 'dark' ? 'light' : 'dark')
})

applyTheme(localStorage.getItem('siswa-theme') || 'dark')


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
// MODAL KONFIRMASI (pengganti confirm())
// ===============================

function askConfirm(message) {

    return new Promise((resolve) => {

        confirmModalText.textContent = message

        confirmModal.classList.add('open')

        function onConfirm() {
            cleanup()
            resolve(true)
        }

        function onCancel() {
            cleanup()
            resolve(false)
        }

        function onOverlayClick(event) {
            if (event.target === confirmModal) {
                onCancel()
            }
        }

        function onKeydown(event) {
            if (event.key === 'Escape') {
                onCancel()
            }
        }

        function cleanup() {
            confirmModal.classList.remove('open')
            confirmDeleteBtn.removeEventListener('click', onConfirm)
            confirmCancelBtn.removeEventListener('click', onCancel)
            confirmModal.removeEventListener('click', onOverlayClick)
            document.removeEventListener('keydown', onKeydown)
        }

        confirmDeleteBtn.addEventListener('click', onConfirm)
        confirmCancelBtn.addEventListener('click', onCancel)
        confirmModal.addEventListener('click', onOverlayClick)
        document.addEventListener('keydown', onKeydown)

    })
}


// ===============================
// VALIDASI FORM
// ===============================

function setFieldError(inputEl, errorEl, message) {
    if (message) {
        inputEl.classList.add('invalid')
        errorEl.textContent = message
        errorEl.classList.add('show')
    } else {
        inputEl.classList.remove('invalid')
        errorEl.textContent = ''
        errorEl.classList.remove('show')
    }
}

function clearFormErrors() {
    setFieldError(nis, nisError, '')
    setFieldError(nama, namaError, '')
    setFieldError(kelas, kelasError, '')
    setFieldError(alamat, alamatError, '')
    setFieldError(foto, fotoError, '')
}

// Bersihkan error field begitu user mulai mengetik ulang
;[[nis, nisError], [nama, namaError], [kelas, kelasError], [alamat, alamatError]].forEach(
    ([inputEl, errorEl]) => {
        inputEl.addEventListener('input', () => setFieldError(inputEl, errorEl, ''))
    }
)

// Preview foto begitu file dipilih
foto.addEventListener('change', () => {

    setFieldError(foto, fotoError, '')

    const file = foto.files[0]

    if (!file) {
        fotoPreviewWrap.style.display = 'none'
        return
    }

    const reader = new FileReader()

    reader.onload = (event) => {
        fotoPreview.src = event.target.result
        fotoPreviewWrap.style.display = 'block'
    }

    reader.readAsDataURL(file)
})

function validateForm() {

    let isValid = true
    let firstInvalid = null

    clearFormErrors()

    const nisValue = nis.value.trim()
    if (!nisValue) {
        setFieldError(nis, nisError, 'NIS wajib diisi')
        isValid = false
        firstInvalid = firstInvalid || nis
    } else if (!/^\d+$/.test(nisValue) || Number(nisValue) <= 0) {
        setFieldError(nis, nisError, 'NIS harus berupa angka positif')
        isValid = false
        firstInvalid = firstInvalid || nis
    }

    const namaValue = nama.value.trim()
    if (!namaValue) {
        setFieldError(nama, namaError, 'Nama wajib diisi')
        isValid = false
        firstInvalid = firstInvalid || nama
    } else if (namaValue.length < 3) {
        setFieldError(nama, namaError, 'Nama minimal 3 karakter')
        isValid = false
        firstInvalid = firstInvalid || nama
    }

    const kelasValue = kelas.value.trim()
    if (!kelasValue) {
        setFieldError(kelas, kelasError, 'Kelas wajib diisi')
        isValid = false
        firstInvalid = firstInvalid || kelas
    } else if (kelasValue.length < 2) {
        setFieldError(kelas, kelasError, 'Kelas minimal 2 karakter')
        isValid = false
        firstInvalid = firstInvalid || kelas
    }

    const alamatValue = alamat.value.trim()
    if (!alamatValue) {
        setFieldError(alamat, alamatError, 'Alamat wajib diisi')
        isValid = false
        firstInvalid = firstInvalid || alamat
    } else if (alamatValue.length < 5) {
        setFieldError(alamat, alamatError, 'Alamat minimal 5 karakter')
        isValid = false
        firstInvalid = firstInvalid || alamat
    }

    const fotoFile = foto.files[0]
    if (fotoFile) {
        if (!fotoFile.type.startsWith('image/')) {
            setFieldError(foto, fotoError, 'File harus berupa gambar')
            isValid = false
            firstInvalid = firstInvalid || foto
        } else if (fotoFile.size > 10 * 1024 * 1024) {
            setFieldError(foto, fotoError, 'Ukuran foto maksimal 10MB')
            isValid = false
            firstInvalid = firstInvalid || foto
        }
    }

    if (!isValid && firstInvalid) {
        firstInvalid.focus()
    }

    return isValid
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

        allSiswa = result.data || []
        currentResult = allSiswa

        populateKelasFilter()

        currentPage = 1

        renderView()

    } catch (error) {

        console.error(error)

        showError('Gagal mengambil data siswa')

    } finally {

        hideLoading()

    }
}


// ===============================
// FILTER KELAS (dropdown)
// ===============================

function populateKelasFilter() {

    const selected = kelasFilter.value

    const uniqueKelas = [...new Set(allSiswa.map(s => s.kelas))].sort()

    kelasFilter.innerHTML = '<option value="">Semua Kelas</option>' +
        uniqueKelas.map(k => `<option value="${k}">${k}</option>`).join('')

    if (uniqueKelas.includes(selected)) {
        kelasFilter.value = selected
    }
}


// ===============================
// SEARCH + FILTER + PAGINATION
// ===============================

function getFilteredSiswa() {
    return currentResult
}

// Panggil GET /siswa/search saat ada keyword pencarian atau filter kelas aktif.
// Kalau keduanya kosong, langsung pakai data yang sudah di-cache (allSiswa)
// biar tidak bolak-balik ke server tanpa perlu.
async function fetchFilteredResult() {

    const keyword = searchInput.value.trim()
    const kelasValue = kelasFilter.value

    if (!keyword && !kelasValue) {
        currentResult = allSiswa
        renderView()
        return
    }

    showLoading()

    try {

        const params = new URLSearchParams()
        if (keyword) params.set('search', keyword)
        if (kelasValue) params.set('kelas', kelasValue)

        const response = await fetch(`${API_URL}/search?${params.toString()}`)

        if (!response.ok) {
            throw new Error('Gagal mencari data siswa')
        }

        const result = await response.json()

        currentResult = result.data || []

        renderView()

    } catch (error) {

        console.error(error)

        showError('Gagal mencari data siswa')

    } finally {

        hideLoading()

    }
}

function renderView() {

    const filtered = currentResult

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

    if (currentPage > totalPages) currentPage = totalPages
    if (currentPage < 1) currentPage = 1

    const start = (currentPage - 1) * PAGE_SIZE
    const pageItems = filtered.slice(start, start + PAGE_SIZE)

    renderSiswa(pageItems, filtered.length)
    renderPagination(filtered.length, totalPages)
}

function renderPagination(totalItems, totalPages) {

    if (totalItems === 0) {
        paginationInfo.textContent = 'Tidak ada data'
    } else {
        const start = (currentPage - 1) * PAGE_SIZE + 1
        const end = Math.min(currentPage * PAGE_SIZE, totalItems)
        paginationInfo.textContent = `Menampilkan ${start}-${end} dari ${totalItems} · Halaman ${currentPage}/${totalPages}`
    }

    prevPageBtn.disabled = currentPage <= 1
    nextPageBtn.disabled = currentPage >= totalPages
}

searchInput.addEventListener('input', () => {
    currentPage = 1
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = setTimeout(fetchFilteredResult, 300)
})

kelasFilter.addEventListener('change', () => {
    currentPage = 1
    fetchFilteredResult()
})

prevPageBtn.addEventListener('click', () => {
    currentPage -= 1
    renderView()
})

nextPageBtn.addEventListener('click', () => {
    currentPage += 1
    renderView()
})


// ===============================
// TAMPILKAN DATA
// ===============================

function avatarHtml(siswa) {

    if (siswa.foto) {
        return `<img src="/${siswa.foto}" alt="Foto ${siswa.nama}" class="avatar">`
    }

    const initial = siswa.nama ? siswa.nama.trim().charAt(0).toUpperCase() : '?'

    return `<div class="avatar avatar-placeholder">${initial}</div>`
}

function renderSiswa(data, totalFiltered) {

    siswaTable.innerHTML = ''

    if (!data || data.length === 0) {

        const message = totalFiltered === 0 && allSiswa.length > 0
            ? 'Tidak ada siswa yang cocok dengan pencarian/filter'
            : 'Belum ada data siswa'

        siswaTable.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    ${message}
                </td>
            </tr>
        `

        return
    }

    data.forEach(siswa => {

        const row = document.createElement('tr')

        row.innerHTML = `
            <td>${avatarHtml(siswa)}</td>
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
                        onclick="deleteSiswa(${siswa.id}, '${String(siswa.nama).replace(/'/g, "\\'")}')"
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

    if (!validateForm()) {
        return
    }

    const id = siswaId.value

    const formData = new FormData()
    formData.append('nis', nis.value.trim())
    formData.append('nama', nama.value.trim())
    formData.append('kelas', kelas.value.trim())
    formData.append('alamat', alamat.value.trim())

    if (foto.files[0]) {
        formData.append('foto', foto.files[0])
    }

    const originalButtonText = submitButton.textContent
    submitButton.disabled = true
    submitButton.textContent = id ? 'Menyimpan...' : 'Menambahkan...'

    try {

        let response

        // EDIT
        if (id) {

            response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                body: formData
            })

        }

        // TAMBAH
        else {

            response = await fetch(API_URL, {
                method: 'POST',
                body: formData
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

    } finally {

        submitButton.disabled = false
        submitButton.textContent = originalButtonText

    }

})


// ===============================
// EDIT SISWA
// ===============================

function editSiswa(id) {

    const siswa = allSiswa.find(item => item.id == id)

    if (!siswa) {
        showError('Data siswa tidak ditemukan')
        return
    }

    clearFormErrors()

    foto.value = ''

    if (siswa.foto) {
        fotoPreview.src = `/${siswa.foto}`
        fotoPreviewWrap.style.display = 'block'
    } else {
        fotoPreviewWrap.style.display = 'none'
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
}


// ===============================
// HAPUS SISWA
// ===============================

async function deleteSiswa(id, nama) {

    const pesan = nama
        ? `Data siswa "${nama}" akan dihapus permanen. Lanjutkan?`
        : 'Data siswa ini akan dihapus permanen. Lanjutkan?'

    const yakin = await askConfirm(pesan)

    if (!yakin) {
        return
    }

    const originalButtonText = confirmDeleteBtn.textContent
    confirmDeleteBtn.disabled = true
    confirmDeleteBtn.textContent = 'Menghapus...'

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

    } finally {

        confirmDeleteBtn.disabled = false
        confirmDeleteBtn.textContent = originalButtonText

    }
}


// ===============================
// RESET FORM
// ===============================

function resetForm() {

    siswaForm.reset()

    siswaId.value = ''

    clearFormErrors()

    fotoPreviewWrap.style.display = 'none'

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