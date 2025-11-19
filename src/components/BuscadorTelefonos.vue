<template>
  <div class="container">
    <div class="header-row">
      <h1 class="title">Buscador de Teléfonos</h1>

      <div class="header-actions">
        <label class="upload-button">
          Subir CSV
          <input type="file" accept=".csv" @change="handleFileChange" class="hidden-file-input" />
        </label>
        <span v-if="uploadedFileName" class="uploaded-name-header">{{ uploadedFileName }}</span>

        <div class="logo-wrapper" ref="logoRef">
          <img src="/Claro.svg.png" alt="Logo Empresa" class="company-logo" @click="toggleMenu" />

          <div v-if="showMenu" ref="menuRef" class="logo-menu" role="menu" aria-label="Menú de usuario">
            <button class="menu-item" @click="logout">Cerrar sesión</button>
          </div>
        </div>
      </div>
    </div>

    

    <div class="search-box">
      <div class="filters-grid">
        <div class="filter-group">
          <label class="filter-label">Buscar por modelo</label>
          <div class="search-input-wrapper">
            <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input 
              type="text" 
              class="search-input" 
              placeholder="Ej: APPLE IPHONE 13"
              v-model="searchTerm"
            />
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label">Filtrar por campaña</label>
          <select class="campaign-select" v-model="selectedCampaign">
            <option value="">Todas las campañas</option>
            <option v-for="campaign in campaigns" :key="campaign" :value="campaign">{{ campaign }}</option>
          </select>
        </div>
      </div>

      <div class="results-count">
        {{ resultsCountText }}
      </div>
    </div>

    <div class="loading" v-if="isLoading">
      <div class="spinner"></div>
      <p>Cargando datos...</p>
    </div>

    <div class="error-state" v-else-if="hasError">
      <p class="error-title">Error al cargar el archivo CSV</p>
      <p class="error-subtitle">Asegúrate de que el archivo data.csv esté en la carpeta public</p>
    </div>

    <div class="no-results" v-else-if="!isLoading && filteredPhones.length === 0">
      <template v-if="!uploadedFileName">
        <p class="no-results-title">No hay datos cargados</p>
        <p class="no-results-subtitle">Sube un archivo CSV usando el botón "Subir CSV" junto al logo.</p>
      </template>
      <template v-else>
        <p class="no-results-title">No se encontraron resultados</p>
        <p class="no-results-subtitle">Intenta con otros términos de búsqueda</p>
      </template>
    </div>
    
    <div class="cards-grid" v-else>
      <PhoneCard 
        v-for="(phone, index) in paginatedPhones" 
        :key="phone.ID_CEL + phone.CAMPANA + index" 
        :phone="phone"
      />
    </div>

    <div class="pagination" v-if="totalPages > 1">
      <button 
        class="pagination-btn" 
        :disabled="currentPage === 1" 
        @click="changePage(currentPage - 1)">
        ← Anterior
      </button>

      <div class="page-numbers">
        <button 
          v-if="currentPage > 3"
          class="page-btn"
          @click="changePage(1)">
          1
        </button>
        
        <span class="page-dots" v-if="currentPage > 4">...</span>
        
        <button 
          v-for="page in paginationRange" 
          :key="page"
          :class="['page-btn', { active: page === currentPage }]" 
          @click="changePage(page)">
          {{ page }}
        </button>
        
        <span class="page-dots" v-if="currentPage < totalPages - 3">...</span>
        
        <button 
          v-if="currentPage < totalPages - 2"
          class="page-btn"
          @click="changePage(totalPages)">
          {{ totalPages }}
        </button>
      </div>

      <button 
        class="pagination-btn" 
        :disabled="currentPage === totalPages" 
        @click="changePage(currentPage + 1)">
        Siguiente →
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import PhoneCard from './PhoneCard.vue'
import Papa from 'papaparse'
import { supabase } from '../lib/supabase'

const emit = defineEmits(['logout'])

const allData = ref([])
const campaigns = ref([])
const searchTerm = ref('')
const selectedCampaign = ref('')
const currentPage = ref(1)
const itemsPerPage = 50
const isLoading = ref(false)
const hasError = ref(false)
const showMenu = ref(false)
const logoRef = ref(null)
const menuRef = ref(null)
const router = useRouter()
const uploadedFileName = ref('')

const loadCSV = () => {
  fetch('/CAMPANA_PRECIOS.csv')
    .then(response => {
      if (!response.ok) throw new Error('No se pudo cargar el archivo CSV')
      return response.text()
    })
    .then(csvText => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          allData.value = results.data
          populateCampaigns(results.data)
          isLoading.value = false
        },
        error: (error) => {
          console.error('Error al parsear CSV:', error)
          hasError.value = true
          isLoading.value = false
        }
      })
    })
    .catch(error => {
      console.error('Error al cargar CSV:', error)
      hasError.value = true
      isLoading.value = false
    })
}

// Manejar archivo CSV subido por el usuario
const handleFileChange = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  uploadedFileName.value = file.name
  isLoading.value = true
  hasError.value = false

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      allData.value = results.data
      populateCampaigns(results.data)
      isLoading.value = false
    },
    error: (error) => {
      console.error('Error al parsear CSV subido:', error)
      hasError.value = true
      isLoading.value = false
    }
  })
}

const clearUploaded = () => {
  uploadedFileName.value = ''
  // Limpiar datos y mostrar estado inicial (sin CSV cargado)
  allData.value = []
  campaigns.value = []
  isLoading.value = false
  hasError.value = false
}

const populateCampaigns = (data) => {
  const uniqueCampaigns = [...new Set(data.map(item => item.CAMPANA))].filter(Boolean)
  campaigns.value = uniqueCampaigns.sort()
}

// ARREGLADO: Removí el reset de currentPage de aquí
const filteredPhones = computed(() => {
  if (!allData.value.length) return []

  return allData.value.filter(item => {
    const term = searchTerm.value.toLowerCase()
    
    const matchesSearch = !term || 
      item.ID_CEL?.toLowerCase().includes(term)

    const matchesCampaign = !selectedCampaign.value || 
      item.CAMPANA === selectedCampaign.value
    
    return matchesSearch && matchesCampaign
  })
})

const paginatedPhones = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  return filteredPhones.value.slice(startIndex, endIndex)
})

const resultsCountText = computed(() => {
  const total = filteredPhones.value.length
  const startItem = total > 0 ? (currentPage.value - 1) * itemsPerPage + 1 : 0
  const endItem = Math.min(currentPage.value * itemsPerPage, total)
  return `Mostrando ${startItem}-${endItem} de ${total} resultados`
})

const totalPages = computed(() => {
  return Math.ceil(filteredPhones.value.length / itemsPerPage)
})

const paginationRange = computed(() => {
  const range = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 1) return []

  const startPage = Math.max(1, current - 2)
  const endPage = Math.min(total, current + 2)

  for (let i = startPage; i <= endPage; i++) {
    range.push(i)
  }

  return range
})

const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleDocumentClick = (e) => {
  const target = e.target
  if (!showMenu.value) return
  if (logoRef.value && logoRef.value.contains(target)) return
  if (menuRef.value && menuRef.value.contains(target)) return
  showMenu.value = false
}

onMounted(() => {
  // No cargar CSV por defecto: esperar a que el usuario suba uno
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})

const toggleMenu = (e) => {
  e.stopPropagation()
  showMenu.value = !showMenu.value
}

const closeMenu = () => {
  showMenu.value = false
}

const logout = async () => {
  try {
    if (supabase && supabase.auth && typeof supabase.auth.signOut === 'function') {
      await supabase.auth.signOut()
    }
  } catch (err) {
    console.error('Error during signOut:', err)
  }

  emit('logout')
  closeMenu()

  try {
    await router.push('/login')
  } catch (err) {
    console.warn('No se pudo navegar a /login, redirigiendo a /', err)
    try { await router.push('/') } catch (e) { /* no-op */ }
  }
}

watch([searchTerm, selectedCampaign], () => {
  currentPage.value = 1
})
</script>

<style scoped>
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 32px;
}

.title {
  font-size: 30px;
  font-weight: bold;
  color: #1f2937;
}

.company-logo {
  height: 48px;
  max-height: 48px;
  width: auto;
  object-fit: contain;
  cursor: pointer;
  transition: opacity 0.2s;
}

.company-logo:hover {
  opacity: 0.8;
}

.logo-wrapper {
  position: relative;
  display: inline-block;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.upload-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: white;
  cursor: pointer;
  font-weight: 600;
}

.hidden-file-input {
  display: none;
}

.uploaded-name-header {
  font-size: 13px;
  color: #6b7280;
}

.logo-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  background: white;
  border: 1px solid rgba(0,0,0,0.12);
  box-shadow: 0 6px 18px rgba(0,0,0,0.08);
  border-radius: 8px;
  min-width: 160px;
  z-index: 50;
  padding: 6px 0;
}

.menu-item {
  display: block;
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: transparent;
  text-align: left;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background: #f3f4f6;
}

.search-box {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 24px;
}

.filters-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 768px) {
  .filters-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.search-input-wrapper {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #9ca3af;
}

.search-input {
  width: 100%;
  padding: 10px 16px 10px 40px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.campaign-select {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.campaign-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.results-count {
  margin-top: 16px;
  font-size: 14px;
  color: #6b7280;
}

.loading {
  text-align: center;
  padding: 48px 0;
}

.spinner {
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading p {
  color: #6b7280;
}

.cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 768px) {
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .cards-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 32px;
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.pagination-btn {
  padding: 8px 16px;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #f9fafb;
  border-color: #3b82f6;
  color: #3b82f6;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
  align-items: center;
}

.page-btn {
  min-width: 40px;
  height: 40px;
  padding: 8px;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover {
  background-color: #f9fafb;
  border-color: #3b82f6;
  color: #3b82f6;
}

.page-btn.active {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.page-dots {
  padding: 0 8px;
  color: #9ca3af;
  font-weight: 500;
}

.no-results {
  text-align: center;
  padding: 48px 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.upload-row {
  background: #fff;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.uploaded-name {
  font-size: 13px;
  color: #6b7280;
}

.clear-upload {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: white;
  cursor: pointer;
}

.no-results-title {
  font-size: 18px;
  color: #6b7280;
  margin-bottom: 8px;
}

.no-results-subtitle {
  font-size: 14px;
  color: #9ca3af;
}

.error-state {
  text-align: center;
  padding: 48px 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.error-title {
  font-size: 18px;
  color: #dc2626;
  margin-bottom: 8px;
}

.error-subtitle {
  font-size: 14px;
  color: #9ca3af;
}

@media (max-width: 480px) {
  .header-row {
    align-items: flex-start;
    gap: 0.5rem;
  }

  .title {
    font-size: 24px;
  }

  .company-logo {
    height: 36px;
    max-height: 36px;
  }
}
</style>