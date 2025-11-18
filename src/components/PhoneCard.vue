<template>
  <div class="card">
    <div class="card-image">
      <img 
        :src="imageUrl" 
        :alt="phone.ID_CEL || 'Teléfono'" 
        @error="handleImageError"
      >
    </div>
    <div class="card-header">
      <h3 class="card-title">{{ phone.ID_CEL || 'N/A' }}</h3>
      <span class="card-badge">{{ phone.CAMPANA || 'N/A' }}</span>
    </div>
    
    <div class="card-body">
      <div class="card-row">
        <span class="card-label">Tipo:</span>
        <span class="card-value">{{ phone.TIPO_SERVICIO || 'N/A' }}</span>
      </div>
      
      <div class="card-row">
        <span class="card-label">Planes:</span>
        <div class="card-plans">{{ phone.PLANES || 'N/A' }}</div>
      </div>
      
      <div class="card-price-section">
        <span class="card-price">{{ formattedPrice }}</span>
      </div>
      
      <div class="card-dates-section">
        <div>Vigencia: {{ formattedStartDate }} - {{ formattedEndDate }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

import samsungLogo from '../assets/Samsung.png'
import appleLogo from '../assets/Iphone.png'
import xiaomiLogo from '../assets/Xiaomi.png'
import motorolaLogo from '../assets/Motorola.png'
import huaweiLogo from '../assets/Huawei.png'
import honorLogo from '../assets/Honor.png'
import oppoLogo from '../assets/Oppo.png'
import zteLogo from '../assets/ZTE.png'

const props = defineProps({
  phone: {
    type: Object,
    required: true
  }
})

// Imágenes locales importadas
const brandImagesLocal = {
  'SAMSUNG': samsungLogo,
  'APPLE': appleLogo,
  'XIAOMI': xiaomiLogo,
  'MOTOROLA': motorolaLogo,
  'HUAWEI': huaweiLogo,
  'HONOR': honorLogo,
  'OPPO': oppoLogo,
  'ZTE': zteLogo,
}

// Fallback a imágenes externas (para marcas sin imagen local)
const brandImagesFallback = {
  'SAMSUNG': 'https://w7.pngwing.com/pngs/528/316/png-transparent-samsung-galaxy-note-8-samsung-electronics-logo-telephone-samsung-blue-text-computer.png',
  'APPLE': 'https://www.apple.com/ac/structured-data/images/knowledge_graph_logo.png',
  'ALCATEL': 'https://i0.wp.com/www.vectorizando.com/wp-content/uploads/2021/04/Alcatel-mobile-0ab63229.png?fit=500%2C500&ssl=1',
  'AZUMI': 'https://manuals.plus/wp-content/uploads/2022/06/AZUMI-logo.png',
  'COOLPAD': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Coolpad_logo.svg/2560px-Coolpad_logo.svg.png',
  'HONOR': 'https://cdn.worldvectorlogo.com/logos/honor-1.svg',
  'HUAWEI': 'https://cdn.worldvectorlogo.com/logos/huawei-2.svg',
  'LG': 'https://images.seeklogo.com/logo-png/32/2/novo-lg-logo-png_seeklogo-320154.png',
  'MOTOROLA': 'https://cdn.worldvectorlogo.com/logos/motorola-3.svg',
  'OPPO': 'https://image.oppo.com/content/dam/oppo/common/mkt/v2-2/navigation/img/logo.png',
  'TCL': 'https://logodownload.org/wp-content/uploads/2016/09/tcl-logo-0.png',
  'TMCELL': 'https://tmcell.com/wp-content/uploads/2021/12/logo_tmcell-.png',
  'VIVO': 'https://upload.wikimedia.org/wikipedia/commons/1/13/Vivo_logo_2019.svg',
  'XIAOMI': 'https://cdn.worldvectorlogo.com/logos/xiaomi-3.svg',
  'ZTE': 'https://cdn.worldvectorlogo.com/logos/zte-logo.svg'
}

const getBrand = (phoneName) => {
  if (!phoneName) return null
  const name = phoneName.toUpperCase()
  
  // Buscar en todas las marcas disponibles (locales + fallback)
  const allBrands = [...new Set([...Object.keys(brandImagesLocal), ...Object.keys(brandImagesFallback)])]
  
  for (const brand of allBrands) {
    if (name.startsWith(brand)) return brand
  }
  return null
}

const getPhoneImage = (phoneName) => {
  if (!phoneName) return 'https://via.placeholder.com/150/6B7280/ffffff?text=Sin+Imagen'
  
  const brand = getBrand(phoneName)
  
  if (!brand) {
    return 'https://via.placeholder.com/200/6B7280/ffffff?text=Telefono'
  }
  
  // Primero buscar en imágenes locales
  if (brandImagesLocal[brand]) {
    return brandImagesLocal[brand]
  }
  
  // Si no existe local, usar fallback externo
  if (brandImagesFallback[brand]) {
    return brandImagesFallback[brand]
  }
  
  return 'https://via.placeholder.com/200/6B7280/ffffff?text=Telefono'
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  const parts = dateStr.split(' ')[0].split('/')
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10)
    const year = parseInt(parts[2], 10)
    return `${day}/${month}/${year}`
  }
  return 'N/A'
}

const imageUrl = computed(() => getPhoneImage(props.phone.ID_CEL))
const currentBrand = computed(() => getBrand(props.phone.ID_CEL))
const formattedPrice = computed(() => props.phone.PRECIO ? `S/ ${props.phone.PRECIO}` : 'N/A')
const formattedStartDate = computed(() => formatDate(props.phone.VIGENCIA_INI))
const formattedEndDate = computed(() => formatDate(props.phone.VIGENCIA_FIN))

const handleImageError = (event) => {
  const img = event.target
  const brand = currentBrand.value
  
  console.error('Error cargando imagen:', img.src, 'para marca:', brand)
  
  // Si la imagen actual es local y falla, intentar con fallback externo
  if (brand && brandImagesFallback[brand]) {
    const currentSrc = img.src
    const fallbackSrc = brandImagesFallback[brand]
    
    // Solo cambiar si no es ya el fallback
    if (!currentSrc.includes('http') || currentSrc !== fallbackSrc) {
      console.log('Usando fallback para:', brand)
      img.src = fallbackSrc
      return
    }
  }
  
  // Si todo falla, usar placeholder genérico
  img.src = 'https://via.placeholder.com/150/6B7280/ffffff?text=Sin+Imagen'
}
</script>

<style scoped>
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  transition: box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.card-image {
  width: 100%;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  border-radius: 6px;
  margin-bottom: 16px;
  padding: 16px;
}

.card-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.card-header {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 16px;
  margin-bottom: 16px;
}

.card-title {
  font-size: 18px;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 8px;
}

.card-badge {
  display: inline-block;
  padding: 4px 12px;
  background-color: #dbeafe;
  color: #1e40af;
  font-size: 12px;
  font-weight: 600;
  border-radius: 9999px;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
}

.card-row {
  display: flex;
  flex-direction: column;
}

.card-label {
  font-weight: 600;
  color: #374151;
}

.card-value {
  color: #6b7280;
  margin-left: 8px;
}

.card-plans {
  color: #6b7280;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.6;
}

.card-price-section {
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
  margin-top: 8px;
}

.card-price {
  font-size: 28px;
  font-weight: bold;
  color: #10b981;
}

.card-dates-section {
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
}
</style>