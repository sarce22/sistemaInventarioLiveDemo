import Swal from 'sweetalert2';

/**
 * MOCK: Generación de PDF deshabilitada en la versión Demo.
 * Muestra un mensaje informativo con SweetAlert2.
 */
export const generateStockPDF = (products, user) => {
  Swal.fire({
    icon: 'info',
    title: 'Función no disponible en Demo',
    text: 'La descarga de reportes en PDF solo está disponible en la versión final del sistema de inventarios.',
    confirmButtonColor: '#2b6cb0' // Brand Blue matching the UI theme color
  });
};

/**
 * MOCK: Generación de PDF deshabilitada en la versión Demo.
 * Muestra un mensaje informativo con SweetAlert2.
 */
export const generateOrderPDF = (order, user) => {
  Swal.fire({
    icon: 'info',
    title: 'Función no disponible en Demo',
    text: 'La descarga de reportes en PDF solo está disponible en la versión final del sistema de inventarios.',
    confirmButtonColor: '#2b6cb0'
  });
};
