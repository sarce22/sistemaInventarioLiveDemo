import axios from 'axios';

// For the Live Demo, we will mock the backend database in localStorage.
// All API requests are intercepted and handled client-side using localStorage.

// Helper to delay response to simulate network latency
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to generate a random ID
const generateId = (items) => {
  if (!items || items.length === 0) return 1;
  return Math.max(...items.map(item => parseInt(item.id) || 0)) + 1;
};

// Seed initial data if not present in localStorage
const initDB = () => {
  if (!localStorage.getItem('db_users')) {
    localStorage.setItem('db_users', JSON.stringify([
      { id: 1, nombre: "Administrador Demo", username: "admin", password: "admin123", rol: "ADMIN", createdAt: new Date().toISOString() },
      { id: 2, nombre: "Empleado Demo", username: "empleado", password: "empleado123", rol: "EMPLEADO", createdAt: new Date().toISOString() }
    ]));
  }
  if (!localStorage.getItem('db_categorias')) {
    localStorage.setItem('db_categorias', JSON.stringify([
      { id: 1, nombre: "Electrónicos" },
      { id: 2, nombre: "Alimentos" },
      { id: 3, nombre: "Hogar" },
      { id: 4, nombre: "Ropa" }
    ]));
  }
  if (!localStorage.getItem('db_productos')) {
    localStorage.setItem('db_productos', JSON.stringify([
      { id: 1, sku: "PROD-001", nombre: "Laptop Gamer Pro", descripcion: "Procesador Intel i7, 16GB RAM, SSD 512GB", precio: 1200000, stock_actual: 15, stock_minimo: 5, categoria_id: 1, unidad_medida: "UNIDAD" },
      { id: 2, sku: "PROD-002", nombre: "Smartphone X12", descripcion: "Pantalla AMOLED 120Hz, Cámara 108MP", precio: 799900, stock_actual: 3, stock_minimo: 8, categoria_id: 1, unidad_medida: "UNIDAD" },
      { id: 3, sku: "PROD-003", nombre: "Cafetera Italiana", descripcion: "Cafetera de acero inoxidable para 6 tazas", precio: 45000, stock_actual: 20, stock_minimo: 10, categoria_id: 3, unidad_medida: "UNIDAD" },
      { id: 4, sku: "PROD-004", nombre: "Auriculares Inalámbricos", descripcion: "Cancelación activa de ruido, 30h de batería", precio: 89000, stock_actual: 25, stock_minimo: 10, categoria_id: 1, unidad_medida: "UNIDAD" },
      { id: 5, sku: "PROD-005", nombre: "Arroz Premium (Bolsa)", descripcion: "Grano entero seleccionado, bolsa de 1kg", precio: 2500, stock_actual: 100, stock_minimo: 20, categoria_id: 2, unidad_medida: "KILOGRAMO" },
      { id: 6, sku: "PROD-006", nombre: "Silla Ergonómica", descripcion: "Soporte lumbar ajustable, reposacabezas 3D", precio: 150000, stock_actual: 2, stock_minimo: 5, categoria_id: 3, unidad_medida: "UNIDAD" }
    ]));
  }
  if (!localStorage.getItem('db_pedidos')) {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    localStorage.setItem('db_pedidos', JSON.stringify([
      {
        id: 1,
        numero_pedido: "PED-0001",
        creado_por_id: 1,
        creado_por: "Administrador Demo",
        estado: "RECIBIDO",
        createdAt: fiveDaysAgo.toISOString(),
        updatedAt: fiveDaysAgo.toISOString(),
        detalles: [
          { id: 1, producto_id: 1, nombre: "Laptop Gamer Pro", sku: "PROD-001", unidad_medida: "UNIDAD", stock_actual: 15, cantidad_solicitada: 10, precio_estimado: 1200000 }
        ]
      },
      {
        id: 2,
        numero_pedido: "PED-0002",
        creado_por_id: 2,
        creado_por: "Empleado Demo",
        estado: "PENDIENTE",
        createdAt: oneDayAgo.toISOString(),
        updatedAt: oneDayAgo.toISOString(),
        detalles: [
          { id: 2, producto_id: 2, nombre: "Smartphone X12", sku: "PROD-002", unidad_medida: "UNIDAD", stock_actual: 3, cantidad_solicitada: 5, precio_estimado: 799900 },
          { id: 3, producto_id: 6, nombre: "Silla Ergonómica", sku: "PROD-006", unidad_medida: "UNIDAD", stock_actual: 2, cantidad_solicitada: 3, precio_estimado: 150000 }
        ]
      }
    ]));
  }
};

initDB();

const getDB = (key) => JSON.parse(localStorage.getItem(key));
const setDB = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// Custom Axios-like object
const API = {
  defaults: {
    headers: {}
  },
  interceptors: {
    request: { use: () => {} },
    response: { use: () => {} }
  },
  
  async get(url, config) {
    await delay();
    const cleanUrl = url.split('?')[0]; // strip query parameters
    
    // GET /auth/users
    if (cleanUrl === '/auth/users') {
      const users = getDB('db_users').map(u => ({
        id: u.id,
        nombre: u.nombre,
        username: u.username,
        rol: u.rol,
        createdAt: u.createdAt
      }));
      return { data: { status: 'success', data: users } };
    }
    
    // GET /productos
    if (cleanUrl === '/productos') {
      const products = getDB('db_productos');
      const categories = getDB('db_categorias');
      // Hydrate category details
      const hydratedProducts = products.map(p => ({
        ...p,
        categoria: categories.find(c => c.id === p.categoria_id) || { nombre: 'General' }
      }));
      return { data: { status: 'success', data: hydratedProducts } };
    }
    
    // GET /categorias
    if (cleanUrl === '/categorias') {
      const categories = getDB('db_categorias');
      return { data: { status: 'success', data: categories } };
    }
    
    // GET /pedidos
    if (cleanUrl === '/pedidos') {
      const orders = getDB('db_pedidos');
      // format getOrders structure:
      // id, numero_pedido, estado, creado_por, totalItems, costoTotal, createdAt
      const formatted = orders.map(order => {
        const totalItems = order.detalles.length;
        const costoTotal = order.detalles.reduce((sum, d) => sum + (d.cantidad_solicitada * d.precio_estimado), 0);
        return {
          id: order.id,
          numero_pedido: order.numero_pedido,
          estado: order.estado,
          creado_por: order.creado_por,
          totalItems,
          costoTotal: parseFloat(costoTotal.toFixed(2)),
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        };
      });
      return { data: { status: 'success', data: formatted } };
    }
    
    // GET /pedidos/:id
    const orderMatch = cleanUrl.match(/^\/pedidos\/(\d+)$/);
    if (orderMatch) {
      const orderId = parseInt(orderMatch[1]);
      const orders = getDB('db_pedidos');
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        throw { response: { status: 404, data: { status: 'error', message: 'El pedido no existe.' } } };
      }
      const costoTotal = order.detalles.reduce((sum, d) => sum + (d.cantidad_solicitada * d.precio_estimado), 0);
      return {
        data: {
          status: 'success',
          data: {
            ...order,
            costoTotal: parseFloat(costoTotal.toFixed(2))
          }
        }
      };
    }
    
    // GET /reportes/dashboard
    if (cleanUrl === '/reportes/dashboard') {
      const products = getDB('db_productos');
      const categories = getDB('db_categorias');
      
      const valorTotal = products.reduce((sum, p) => sum + (p.precio * p.stock_actual), 0);
      
      const lowStockProducts = products
        .filter(p => p.stock_actual <= p.stock_minimo)
        .map(p => ({
          id: p.id,
          sku: p.sku,
          nombre: p.nombre,
          precio: p.precio,
          stock_actual: p.stock_actual,
          stock_minimo: p.stock_minimo,
          unidad_medida: p.unidad_medida,
          categoria_nombre: categories.find(c => c.id === p.categoria_id)?.nombre || 'General'
        }));
        
      const alertaStockCount = lowStockProducts.length;
      
      const topProducts = [...products]
        .sort((a, b) => b.stock_actual - a.stock_actual)
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          sku: p.sku,
          nombre: p.nombre,
          stock_actual: p.stock_actual,
          precio: p.precio,
          unidad_medida: p.unidad_medida
        }));
        
      return {
        data: {
          status: 'success',
          data: {
            valorTotal: parseFloat(valorTotal.toFixed(2)),
            alertaStockCount,
            topProducts,
            lowStockProducts
          }
        }
      };
    }
    
    throw { response: { status: 404, data: { message: 'Ruta no encontrada' } } };
  },
  
  async post(url, payload, config) {
    await delay();
    
    // POST /auth/login
    if (url === '/auth/login') {
      const { username, password } = payload;
      const users = getDB('db_users');
      const user = users.find(u => u.username === username.trim() && u.password === password);
      
      if (!user) {
        throw { response: { status: 401, data: { status: 'error', message: 'Credenciales inválidas.' } } };
      }
      
      const loggedUser = {
        id: user.id,
        nombre: user.nombre,
        username: user.username,
        rol: user.rol
      };
      
      return {
        data: {
          status: 'success',
          data: {
            token: 'mock-jwt-token-xyz-12345',
            user: loggedUser
          }
        }
      };
    }
    
    // POST /auth/register
    if (url === '/auth/register') {
      const { username, password, nombre, rol } = payload;
      const users = getDB('db_users');
      
      if (users.some(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
        throw { response: { status: 400, data: { status: 'error', message: 'El usuario ya existe.' } } };
      }
      
      const newUser = {
        id: generateId(users),
        nombre: nombre ? nombre.trim() : username.trim(),
        username: username.trim(),
        password: password,
        rol: rol || 'EMPLEADO',
        createdAt: new Date().toISOString()
      };
      
      users.push(newUser);
      setDB('db_users', users);
      
      return { data: { status: 'success', data: newUser } };
    }
    
    // POST /productos
    if (url === '/productos') {
      const products = getDB('db_productos');
      
      if (products.some(p => p.sku.trim().toLowerCase() === payload.sku.trim().toLowerCase())) {
        throw { response: { status: 400, data: { status: 'error', message: 'Ya existe un producto con el mismo SKU.' } } };
      }
      
      const newProduct = {
        id: generateId(products),
        sku: payload.sku.trim(),
        nombre: payload.nombre.trim(),
        descripcion: payload.descripcion ? payload.descripcion.trim() : null,
        precio: parseFloat(payload.precio) || 0,
        stock_actual: parseFloat(payload.stock_actual) || 0,
        stock_minimo: parseFloat(payload.stock_minimo) || 0,
        categoria_id: parseInt(payload.categoria_id),
        unidad_medida: payload.unidad_medida || 'UNIDAD'
      };
      
      products.push(newProduct);
      setDB('db_productos', products);
      
      return { data: { status: 'success', data: newProduct } };
    }
    
    // POST /categorias
    if (url === '/categorias') {
      const categories = getDB('db_categorias');
      const nombre = payload.nombre.trim();
      
      if (categories.some(c => c.nombre.toLowerCase() === nombre.toLowerCase())) {
        throw { response: { status: 400, data: { status: 'error', message: 'Ya existe una categoría con este nombre.' } } };
      }
      
      const newCategory = {
        id: generateId(categories),
        nombre
      };
      
      categories.push(newCategory);
      setDB('db_categorias', categories);
      
      return { data: { status: 'success', data: newCategory } };
    }
    
    // POST /pedidos
    if (url === '/pedidos') {
      const orders = getDB('db_pedidos');
      const products = getDB('db_productos');
      
      let nextNum = 1;
      if (orders.length > 0) {
        const lastOrder = orders[orders.length - 1];
        const match = lastOrder.numero_pedido.match(/PED-(\d+)/);
        if (match) {
          nextNum = parseInt(match[1]) + 1;
        }
      }
      const numero_pedido = `PED-${String(nextNum).padStart(4, '0')}`;
      
      // Get current logged-in user
      let createdBy = 'Sistema';
      let createdById = 1;
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userObj = JSON.parse(userStr);
          createdBy = userObj.nombre || userObj.username;
          createdById = userObj.id;
        }
      } catch (e) {}
      
      const detallesHydrated = payload.detalles.map(d => {
        const prod = products.find(p => p.id === parseInt(d.producto_id));
        if (!prod) {
          throw { response: { status: 400, data: { message: `El producto con ID ${d.producto_id} no existe.` } } };
        }
        return {
          id: Math.floor(Math.random() * 100000),
          producto_id: prod.id,
          nombre: prod.nombre,
          sku: prod.sku,
          unidad_medida: prod.unidad_medida,
          stock_actual: prod.stock_actual,
          cantidad_solicitada: parseFloat(d.cantidad_solicitada),
          precio_estimado: parseFloat(prod.precio)
        };
      });
      
      const newOrder = {
        id: generateId(orders),
        numero_pedido,
        creado_por_id: createdById,
        creado_por: createdBy,
        estado: 'PENDIENTE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        detalles: detallesHydrated
      };
      
      orders.push(newOrder);
      setDB('db_pedidos', orders);
      
      return {
        data: {
          status: 'success',
          message: 'Pedido registrado correctamente en estado pendiente.',
          data: {
            id: newOrder.id,
            numero_pedido: newOrder.numero_pedido,
            estado: newOrder.estado,
            creado_por: newOrder.creado_por
          }
        }
      };
    }
    
    throw { response: { status: 404, data: { message: 'Ruta no encontrada' } } };
  },
  
  async put(url, payload, config) {
    await delay();
    
    // PUT /productos/:id
    const productMatch = url.match(/^\/productos\/(\d+)$/);
    if (productMatch) {
      const id = parseInt(productMatch[1]);
      const products = getDB('db_productos');
      const index = products.findIndex(p => p.id === id);
      
      if (index === -1) {
        throw { response: { status: 404, data: { status: 'error', message: 'El producto no existe.' } } };
      }
      
      // SKU conflict check
      if (products.some(p => p.id !== id && p.sku.toLowerCase() === payload.sku.toLowerCase())) {
        throw { response: { status: 400, data: { status: 'error', message: 'Ya existe un producto con el mismo SKU.' } } };
      }
      
      const updatedProduct = {
        ...products[index],
        sku: payload.sku.trim(),
        nombre: payload.nombre.trim(),
        descripcion: payload.descripcion ? payload.descripcion.trim() : null,
        precio: parseFloat(payload.precio) || 0,
        stock_actual: parseFloat(payload.stock_actual) || 0,
        stock_minimo: parseFloat(payload.stock_minimo) || 0,
        categoria_id: parseInt(payload.categoria_id),
        unidad_medida: payload.unidad_medida || 'UNIDAD'
      };
      
      products[index] = updatedProduct;
      setDB('db_productos', products);
      
      const isLowStock = updatedProduct.stock_actual <= updatedProduct.stock_minimo;
      
      return {
        data: {
          status: 'success',
          alertaStock: isLowStock,
          data: updatedProduct
        }
      };
    }
    
    // PUT /categorias/:id
    const categoryMatch = url.match(/^\/categorias\/(\d+)$/);
    if (categoryMatch) {
      const id = parseInt(categoryMatch[1]);
      const categories = getDB('db_categorias');
      const index = categories.findIndex(c => c.id === id);
      
      if (index === -1) {
        throw { response: { status: 404, data: { status: 'error', message: 'La categoría no existe.' } } };
      }
      
      const nombre = payload.nombre.trim();
      if (categories.some(c => c.id !== id && c.nombre.toLowerCase() === nombre.toLowerCase())) {
        throw { response: { status: 400, data: { status: 'error', message: 'Ya existe una categoría con este nombre.' } } };
      }
      
      categories[index].nombre = nombre;
      setDB('db_categorias', categories);
      
      return { data: { status: 'success', data: categories[index] } };
    }
    
    // PUT /pedidos/:id/recibir
    const receiveMatch = url.match(/^\/pedidos\/(\d+)\/recibir$/);
    if (receiveMatch) {
      const orderId = parseInt(receiveMatch[1]);
      const orders = getDB('db_pedidos');
      const orderIndex = orders.findIndex(o => o.id === orderId);
      
      if (orderIndex === -1) {
        throw { response: { status: 404, data: { status: 'error', message: 'El pedido no existe.' } } };
      }
      
      const order = orders[orderIndex];
      if (order.estado === 'RECIBIDO') {
        throw { response: { status: 400, data: { status: 'error', message: 'Este pedido ya ha sido marcado como recibido.' } } };
      }
      
      // Update order state
      order.estado = 'RECIBIDO';
      order.updatedAt = new Date().toISOString();
      orders[orderIndex] = order;
      setDB('db_pedidos', orders);
      
      // Increment stock of each product in localDB
      const products = getDB('db_productos');
      order.detalles.forEach(detail => {
        const prodIndex = products.findIndex(p => p.id === detail.producto_id);
        if (prodIndex !== -1) {
          products[prodIndex].stock_actual = parseFloat((products[prodIndex].stock_actual + detail.cantidad_solicitada).toFixed(2));
        }
      });
      setDB('db_productos', products);
      
      return {
        data: {
          status: 'success',
          message: 'Mercancía recibida exitosamente. El inventario ha sido incrementado.'
        }
      };
    }
    
    throw { response: { status: 404, data: { message: 'Ruta no encontrada' } } };
  },
  
  async delete(url, config) {
    await delay();
    
    // DELETE /auth/users/:id
    const userMatch = url.match(/^\/auth\/users\/(\d+)$/);
    if (userMatch) {
      const id = parseInt(userMatch[1]);
      const users = getDB('db_users');
      const index = users.findIndex(u => u.id === id);
      
      if (index === -1) {
        throw { response: { status: 404, data: { status: 'error', message: 'El usuario no existe.' } } };
      }
      
      // Prevent deleting current user
      let currentUserId = null;
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          currentUserId = JSON.parse(userStr).id;
        }
      } catch (e) {}
      
      if (id === currentUserId) {
        throw { response: { status: 400, data: { status: 'error', message: 'No puedes eliminar tu propio usuario.' } } };
      }
      
      users.splice(index, 1);
      setDB('db_users', users);
      
      return { data: { status: 'success', message: 'Usuario eliminado correctamente.' } };
    }
    
    // DELETE /productos/:id
    const productMatch = url.match(/^\/productos\/(\d+)$/);
    if (productMatch) {
      const id = parseInt(productMatch[1]);
      const products = getDB('db_productos');
      const index = products.findIndex(p => p.id === id);
      
      if (index === -1) {
        throw { response: { status: 404, data: { status: 'error', message: 'El producto no existe.' } } };
      }
      
      products.splice(index, 1);
      setDB('db_productos', products);
      
      return { data: { status: 'success', message: 'Producto eliminado correctamente.' } };
    }
    
    // DELETE /categorias/:id
    const categoryMatch = url.match(/^\/categorias\/(\d+)$/);
    if (categoryMatch) {
      const id = parseInt(categoryMatch[1]);
      const categories = getDB('db_categorias');
      const index = categories.findIndex(c => c.id === id);
      
      if (index === -1) {
        throw { response: { status: 404, data: { status: 'error', message: 'La categoría no existe.' } } };
      }
      
      // Validate that no products belong to this category
      const products = getDB('db_productos');
      if (products.some(p => p.categoria_id === id)) {
        throw { response: { status: 400, data: { status: 'error', message: 'No se puede eliminar la categoría porque tiene productos asociados.' } } };
      }
      
      categories.splice(index, 1);
      setDB('db_categorias', categories);
      
      return { data: { status: 'success', message: 'Categoría eliminada correctamente.' } };
    }
    
    // DELETE /pedidos/:id
    const orderMatch = url.match(/^\/pedidos\/(\d+)$/);
    if (orderMatch) {
      const id = parseInt(orderMatch[1]);
      const orders = getDB('db_pedidos');
      const index = orders.findIndex(o => o.id === id);
      
      if (index === -1) {
        throw { response: { status: 404, data: { status: 'error', message: 'El pedido no existe.' } } };
      }
      
      const order = orders[index];
      if (order.estado === 'RECIBIDO') {
        throw { response: { status: 400, data: { status: 'error', message: 'No se pueden eliminar pedidos recibidos.' } } };
      }
      
      orders.splice(index, 1);
      setDB('db_pedidos', orders);
      
      return { data: { status: 'success', message: 'Pedido eliminado correctamente.' } };
    }
    
    throw { response: { status: 404, data: { message: 'Ruta no encontrada' } } };
  }
};

export default API;
