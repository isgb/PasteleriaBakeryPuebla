# Bakery Puebla Shop

Sitio web de ejemplo que simula el funcionamiento basico de una pasteleria artesanal. Incluye una tienda publica para clientes y un panel de gestion interno para pasteleros. Todo funciona sin backend — los datos son mock y se persisten en localStorage.

El proyecto esta pensado como demo de portafolio para mostrar habilidades en HTML, CSS y JavaScript vanilla.

## Paginas

### Tienda (`index.html`)

Pagina publica orientada al cliente con las siguientes secciones:

- **Hero** — Presentacion con imagen de fondo y llamados a accion.
- **Estadisticas** — Contadores animados (clientes, pedidos, productos, experiencia).
- **Quienes Somos** — Informacion de la empresa.
- **Servicios** — Reposteria, cafe, pasteles personalizados.
- **Productos Destacados** — Seleccion de productos con badge "Destacado".
- **Catalogo** — Grid completo con filtros por categoria, precio y busqueda de texto.
- **Testimonios** — Opiniones de clientes con rating de estrellas.
- **Formulario de Pedido** — Solicitud de pastel personalizado con validacion frontend.
- **Contacto y Newsletter** — Datos de ubicacion y suscripcion por email.

Funcionalidades interactivas:

- Carrito de compras (agregar, eliminar, modificar cantidad, subtotal).
- Lista de favoritos.
- Modal de detalle de producto con ingredientes y rating.
- Checkout simulado con numero de pedido generado.
- Toast notifications para feedback visual.
- Skeleton loaders durante la carga.
- Empty states cuando no hay resultados.
- Scroll reveal animations.
- Navegacion responsive con menu colapsable.

### Panel de Gestion (`pastelero.html`)

Panel interno protegido con login mock. Permite gestionar pedidos de la pasteleria.

**Credenciales de acceso:**

| Rol        | Email                 | Password |
|------------|-----------------------|----------|
| Pastelero  | pastelero@bakery.com  | 123456   |
| Admin      | admin@bakery.com      | 123456   |

Vistas del panel:

- **Dashboard** — Saludo dinamico, alertas de entregas proximas, 5 tarjetas de metricas, pedidos recientes, grafico de produccion por sabor, producto mas vendido.
- **Pedidos** — Tabla con filtros por estado y prioridad, busqueda por folio/cliente/telefono, ordenamiento por columnas. Vista mobile con cards.
- **Detalle de Pedido** — Modal con informacion del cliente, productos, notas, linea de tiempo visual y botones de accion.
- **Calendario** — Vista semanal de entregas con chips por dia.

Acciones sobre pedidos:

- Aceptar y avanzar estado (pendiente → aceptado → preparando → decorando → listo → entregado).
- Marcar/quitar urgente.
- Cancelar pedido.
- Imprimir detalle.
- Restaurar datos mock.

## Estructura del Proyecto

```
bakeryshop/
├── index.html              # Tienda publica
├── pastelero.html           # Panel de gestion
├── css/
│   ├── bootstrap.css        # Bootstrap 5
│   ├── font-awesome.min.css # Iconos
│   ├── estilos.css          # Design system de la tienda
│   └── panel.css            # Estilos del panel
├── js/
│   ├── app.js               # Logica de la tienda
│   └── panel/               # Modulos del panel (9 archivos)
│       ├── utils.js          #   Helpers, fechas, badges
│       ├── state.js          #   Estado global, CRUD pedidos
│       ├── auth.js           #   Login, logout, sesion
│       ├── ui.js             #   Toast, sidebar, vistas
│       ├── dashboard.js      #   Vista dashboard
│       ├── orders.js         #   Vista lista de pedidos
│       ├── order-detail.js   #   Modal detalle + acciones
│       ├── calendar.js       #   Vista calendario
│       └── events.js         #   Eventos e inicializacion
├── mock/
│   ├── data.js              # Productos, categorias, testimonios
│   ├── users.js             # Usuarios del panel
│   └── orders.js            # Pedidos simulados
├── images/                  # Imagenes de productos y logos
└── fonts/                   # FontAwesome
```

## Tecnologias

- **HTML5** semantico con atributos ARIA.
- **CSS3** con custom properties, flexbox, grid, animaciones y media queries.
- **JavaScript** vanilla (ES5) sin frameworks ni bundlers.
- **Bootstrap 5** para grid y componentes base.
- **Font Awesome 4** para iconografia.
- **Google Fonts** — Pacifico (decorativo) + Poppins (cuerpo).
- **localStorage** para persistencia de carrito, favoritos, sesion y pedidos.

## Como Usar

1. Abrir `index.html` en un navegador. No requiere servidor ni instalacion.
2. Navegar la tienda: agregar productos al carrito, filtrar, hacer checkout.
3. Ir a "Pastelero" en la navbar para acceder al panel.
4. Iniciar sesion con las credenciales de la tabla de arriba.
5. Gestionar pedidos: cambiar estados, filtrar, ver calendario.

Los datos se guardan en localStorage del navegador. Para reiniciar, usar el boton "Restaurar Datos" en el sidebar del panel o limpiar el localStorage del navegador.

## Notas

- No requiere backend, servidor ni base de datos.
- Todos los datos son simulados con propositos de demostracion.
- El proyecto es estatico y puede desplegarse en cualquier hosting (GitHub Pages, Netlify, etc).
- Responsive: funciona en desktop, tablet y mobile.
