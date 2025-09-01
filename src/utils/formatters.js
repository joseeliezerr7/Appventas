export const formatCurrency = (amount) => {
  const number = parseFloat(amount || 0);
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
};

export const formatNumber = (number, decimals = 0) => {
  const num = parseFloat(number || 0);
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

export const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Mexico_City'
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return date.toLocaleDateString('es-MX', options);
};

export const formatDateForInput = (date) => {
  if (!date) return '';
  
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  return date.toISOString().split('T')[0];
};

export const formatPercentage = (value, decimals = 1) => {
  const number = parseFloat(value || 0);
  return `${number.toFixed(decimals)}%`;
};

export const formatPhoneNumber = (phone) => {
  if (!phone) return '-';
  
  // Remover caracteres no numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Formatear como (XXX) XXX-XXXX para números de 10 dígitos
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '-';
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - 3) + '...';
};

export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const formatInventoryStatus = (stock, minStock = 10) => {
  const stockNum = parseInt(stock || 0);
  
  if (stockNum === 0) {
    return { text: 'Sin stock', color: '#F44336', icon: 'alert-circle' };
  } else if (stockNum <= minStock) {
    return { text: 'Stock bajo', color: '#FF9800', icon: 'warning' };
  } else {
    return { text: 'Disponible', color: '#4CAF50', icon: 'checkmark-circle' };
  }
};

export const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};