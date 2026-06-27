var MOCK_ORDERS = (function () {
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  function d(offset, h, m) {
    var dt = new Date(today);
    dt.setDate(dt.getDate() + offset);
    dt.setHours(h || 0, m || 0, 0, 0);
    return dt.toISOString();
  }

  return [
    {
      id: 1,
      folio: "BP-2026-0147",
      client: { name: "Manuel Hernández Pérez", phone: "7568920146", email: "manuel.hp@mail.com" },
      products: [
        { name: "Chocolate Intenso", qty: 1, price: 320, image: "images/pastel-chocolate.jpg" },
        { name: "Trufa de Chocolate", qty: 6, price: 45, image: "images/pastel-chocolate.jpg" }
      ],
      flavor: "Chocolate",
      decoration: "Espigas",
      size: "Grande (30 personas)",
      notes: "Escribir 'Feliz Cumpleaños Mamá' con letras doradas. Entregar antes de las 2pm.",
      priority: "urgent",
      status: "preparando",
      createdAt: d(-2, 9, 15),
      deliveryDate: d(0, 14, 0),
      total: 590,
      assignedTo: "Luis Fernández",
      timeline: [
        { status: "pendiente", date: d(-2, 9, 15), note: "Pedido recibido por la web" },
        { status: "aceptado", date: d(-2, 10, 0), note: "Pedido aceptado por Luis" },
        { status: "preparando", date: d(-1, 7, 30), note: "Inicio de preparación" }
      ]
    },
    {
      id: 2,
      folio: "BP-2026-0148",
      client: { name: "María García López", phone: "2221234567", email: "maria.gl@mail.com" },
      products: [
        { name: "Red Velvet Clásico", qty: 1, price: 350, image: "images/pastel-velvet.jpg" }
      ],
      flavor: "Red Velvet",
      decoration: "Rosas",
      size: "Mediano (15 personas)",
      notes: "Sin gluten si es posible. Color rojo intenso.",
      priority: "normal",
      status: "pendiente",
      createdAt: d(-1, 14, 30),
      deliveryDate: d(0, 18, 0),
      total: 350,
      assignedTo: null,
      timeline: [
        { status: "pendiente", date: d(-1, 14, 30), note: "Pedido recibido por la web" }
      ]
    },
    {
      id: 3,
      folio: "BP-2026-0149",
      client: { name: "Carlos Hernández Ruiz", phone: "2229876543", email: "carlos.hr@mail.com" },
      products: [
        { name: "Capuchino Premium", qty: 1, price: 490, image: "images/pastel-capuchino.jpg" },
        { name: "Mini Capuchino", qty: 12, price: 75, image: "images/pastel-capuchino.jpg" }
      ],
      flavor: "Capuchino",
      decoration: "Fondant",
      size: "Grande (40 personas)",
      notes: "Evento corporativo. Necesito factura. Decoración elegante y sobria.",
      priority: "urgent",
      status: "decorando",
      createdAt: d(-3, 11, 0),
      deliveryDate: d(0, 12, 0),
      total: 1390,
      assignedTo: "Luis Fernández",
      timeline: [
        { status: "pendiente", date: d(-3, 11, 0), note: "Pedido recibido por teléfono" },
        { status: "aceptado", date: d(-3, 11, 30), note: "Pedido aceptado" },
        { status: "preparando", date: d(-2, 6, 0), note: "Inicio de preparación" },
        { status: "decorando", date: d(-1, 14, 0), note: "Pasando a decoración con fondant" }
      ]
    },
    {
      id: 4,
      folio: "BP-2026-0150",
      client: { name: "Ana Martínez Soto", phone: "2225551234", email: "ana.ms@mail.com" },
      products: [
        { name: "Cookies & Cream", qty: 1, price: 420, image: "images/pastel-cookies.jpg" }
      ],
      flavor: "Cookies and Cream",
      decoration: "Obleas",
      size: "Mediano (20 personas)",
      notes: "Cumpleaños infantil. Tema: unicornios.",
      priority: "normal",
      status: "aceptado",
      createdAt: d(-1, 9, 0),
      deliveryDate: d(1, 10, 0),
      total: 420,
      assignedTo: "Luis Fernández",
      timeline: [
        { status: "pendiente", date: d(-1, 9, 0), note: "Pedido recibido por la web" },
        { status: "aceptado", date: d(-1, 10, 15), note: "Pedido aceptado por Luis" }
      ]
    },
    {
      id: 5,
      folio: "BP-2026-0151",
      client: { name: "Roberto López Vega", phone: "2228887654", email: "roberto.lv@mail.com" },
      products: [
        { name: "Mazapán Artesanal", qty: 1, price: 400, image: "images/pastel-mazapan.jpg" },
        { name: "Pay de Mazapán", qty: 1, price: 280, image: "images/pastel-mazapan.jpg" }
      ],
      flavor: "Mazapán",
      decoration: "Letras",
      size: "Grande (25 personas)",
      notes: "Aniversario de bodas. Letras doradas: '25 Años Juntos'.",
      priority: "normal",
      status: "preparando",
      createdAt: d(-2, 16, 45),
      deliveryDate: d(1, 15, 0),
      total: 680,
      assignedTo: "Luis Fernández",
      timeline: [
        { status: "pendiente", date: d(-2, 16, 45), note: "Pedido recibido por la web" },
        { status: "aceptado", date: d(-2, 17, 0), note: "Pedido aceptado" },
        { status: "preparando", date: d(-1, 8, 0), note: "Inicio de preparación" }
      ]
    },
    {
      id: 6,
      folio: "BP-2026-0152",
      client: { name: "Sofía Mendoza Cruz", phone: "2223456789", email: "sofia.mc@mail.com" },
      products: [
        { name: "Pastel 3 Chocolates", qty: 2, price: 380, image: "images/pastel-chocolate.jpg" }
      ],
      flavor: "3 Chocolates",
      decoration: "Velas",
      size: "Mediano (15 personas) x2",
      notes: "Fiesta doble: gemelos cumplen 10 años. Dos pasteles iguales.",
      priority: "urgent",
      status: "pendiente",
      createdAt: d(0, 7, 30),
      deliveryDate: d(0, 16, 0),
      total: 760,
      assignedTo: null,
      timeline: [
        { status: "pendiente", date: d(0, 7, 30), note: "Pedido recibido por WhatsApp" }
      ]
    },
    {
      id: 7,
      folio: "BP-2026-0153",
      client: { name: "Diego Ramírez Torres", phone: "2227778899", email: "diego.rt@mail.com" },
      products: [
        { name: "Red Velvet Clásico", qty: 1, price: 350, image: "images/pastel-velvet.jpg" },
        { name: "Mini Red Velvet", qty: 24, price: 85, image: "images/pastel-velvet.jpg" }
      ],
      flavor: "Red Velvet",
      decoration: "Rosas",
      size: "Grande + 24 mini",
      notes: "Boda civil. Todo en rojo y blanco.",
      priority: "normal",
      status: "listo",
      createdAt: d(-4, 10, 0),
      deliveryDate: d(0, 17, 0),
      total: 2390,
      assignedTo: "Luis Fernández",
      timeline: [
        { status: "pendiente", date: d(-4, 10, 0), note: "Pedido recibido" },
        { status: "aceptado", date: d(-4, 10, 30), note: "Pedido aceptado" },
        { status: "preparando", date: d(-3, 7, 0), note: "Inicio de preparación" },
        { status: "decorando", date: d(-2, 9, 0), note: "Decoración con rosas" },
        { status: "listo", date: d(-1, 16, 0), note: "Pastel terminado y refrigerado" }
      ]
    },
    {
      id: 8,
      folio: "BP-2026-0154",
      client: { name: "Patricia Vargas Luna", phone: "2226665544", email: "patricia.vl@mail.com" },
      products: [
        { name: "Cheesecake Cookies", qty: 1, price: 350, image: "images/pastel-cookies.jpg" }
      ],
      flavor: "Cookies and Cream",
      decoration: "Obleas",
      size: "Mediano (10 personas)",
      notes: "Recoger en tienda a la 1pm.",
      priority: "normal",
      status: "listo",
      createdAt: d(-3, 13, 0),
      deliveryDate: d(0, 13, 0),
      total: 350,
      assignedTo: "Luis Fernández",
      timeline: [
        { status: "pendiente", date: d(-3, 13, 0), note: "Pedido recibido" },
        { status: "aceptado", date: d(-3, 14, 0), note: "Pedido aceptado" },
        { status: "preparando", date: d(-2, 8, 0), note: "Inicio de preparación" },
        { status: "decorando", date: d(-1, 10, 0), note: "Decoración" },
        { status: "listo", date: d(-1, 15, 0), note: "Listo para recoger" }
      ]
    },
    {
      id: 9,
      folio: "BP-2026-0140",
      client: { name: "Luis Ramírez Solís", phone: "5555555555", email: "luis.rs@mail.com" },
      products: [
        { name: "Red Velvet Clásico", qty: 1, price: 350, image: "images/pastel-velvet.jpg" }
      ],
      flavor: "Red Velvet",
      decoration: "Espigas",
      size: "Mediano (15 personas)",
      notes: "Entrega a domicilio en Col. La Paz.",
      priority: "normal",
      status: "entregado",
      createdAt: d(-5, 10, 0),
      deliveryDate: d(-1, 14, 0),
      total: 350,
      assignedTo: "Luis Fernández",
      timeline: [
        { status: "pendiente", date: d(-5, 10, 0), note: "Pedido recibido" },
        { status: "aceptado", date: d(-5, 11, 0), note: "Aceptado" },
        { status: "preparando", date: d(-3, 7, 0), note: "Preparación" },
        { status: "decorando", date: d(-2, 10, 0), note: "Decoración" },
        { status: "listo", date: d(-2, 16, 0), note: "Listo" },
        { status: "entregado", date: d(-1, 14, 30), note: "Entregado al cliente" }
      ]
    },
    {
      id: 10,
      folio: "BP-2026-0138",
      client: { name: "Alejandro Quesada Nieto", phone: "5555555555", email: "alejandro.qn@mail.com" },
      products: [
        { name: "Capuchino Premium", qty: 1, price: 490, image: "images/pastel-capuchino.jpg" }
      ],
      flavor: "Capuchino",
      decoration: "Rosas",
      size: "Grande (25 personas)",
      notes: "Día del padre. Con mensaje personalizado.",
      priority: "normal",
      status: "entregado",
      createdAt: d(-6, 8, 0),
      deliveryDate: d(-2, 11, 0),
      total: 490,
      assignedTo: "Luis Fernández",
      timeline: [
        { status: "pendiente", date: d(-6, 8, 0), note: "Pedido recibido" },
        { status: "aceptado", date: d(-6, 9, 0), note: "Aceptado" },
        { status: "preparando", date: d(-4, 7, 0), note: "Preparación" },
        { status: "decorando", date: d(-3, 12, 0), note: "Decoración" },
        { status: "listo", date: d(-3, 17, 0), note: "Listo" },
        { status: "entregado", date: d(-2, 11, 0), note: "Entregado" }
      ]
    },
    {
      id: 11,
      folio: "BP-2026-0135",
      client: { name: "Felipe López Rosas", phone: "5555555555", email: "felipe.lr@mail.com" },
      products: [
        { name: "Chocolate Intenso", qty: 1, price: 320, image: "images/pastel-chocolate.jpg" },
        { name: "Brownie Capuchino", qty: 12, price: 65, image: "images/pastel-capuchino.jpg" }
      ],
      flavor: "Chocolate",
      decoration: "Velas",
      size: "Mediano + brownies",
      notes: "Reunión de oficina.",
      priority: "normal",
      status: "entregado",
      createdAt: d(-7, 11, 0),
      deliveryDate: d(-3, 12, 0),
      total: 1100,
      assignedTo: "Luis Fernández",
      timeline: [
        { status: "pendiente", date: d(-7, 11, 0), note: "Pedido recibido" },
        { status: "aceptado", date: d(-7, 12, 0), note: "Aceptado" },
        { status: "preparando", date: d(-5, 7, 0), note: "Preparación" },
        { status: "decorando", date: d(-4, 10, 0), note: "Decoración" },
        { status: "listo", date: d(-4, 16, 0), note: "Listo" },
        { status: "entregado", date: d(-3, 12, 15), note: "Entregado en oficina" }
      ]
    },
    {
      id: 12,
      folio: "BP-2026-0142",
      client: { name: "Manuel Salinas Guerrero", phone: "5555555555", email: "manuel.sg@mail.com" },
      products: [
        { name: "Mazapán Artesanal", qty: 1, price: 400, image: "images/pastel-mazapan.jpg" }
      ],
      flavor: "Mazapán",
      decoration: "Letras",
      size: "Mediano (15 personas)",
      notes: "Cliente canceló por cambio de planes.",
      priority: "normal",
      status: "cancelado",
      createdAt: d(-4, 15, 0),
      deliveryDate: d(-1, 16, 0),
      total: 400,
      assignedTo: "Luis Fernández",
      timeline: [
        { status: "pendiente", date: d(-4, 15, 0), note: "Pedido recibido" },
        { status: "aceptado", date: d(-4, 16, 0), note: "Aceptado" },
        { status: "cancelado", date: d(-3, 9, 0), note: "Cancelado por el cliente" }
      ]
    },
    {
      id: 13,
      folio: "BP-2026-0155",
      client: { name: "Gabriela Ruiz Montiel", phone: "2224445566", email: "gaby.rm@mail.com" },
      products: [
        { name: "Mazapán Artesanal", qty: 1, price: 400, image: "images/pastel-mazapan.jpg" }
      ],
      flavor: "Mazapán",
      decoration: "Fondant",
      size: "Grande (30 personas)",
      notes: "XV años. Tema: jardín encantado. Colores pastel.",
      priority: "normal",
      status: "aceptado",
      createdAt: d(0, 8, 0),
      deliveryDate: d(2, 11, 0),
      total: 400,
      assignedTo: "Luis Fernández",
      timeline: [
        { status: "pendiente", date: d(0, 8, 0), note: "Pedido recibido por la web" },
        { status: "aceptado", date: d(0, 8, 45), note: "Pedido aceptado" }
      ]
    },
    {
      id: 14,
      folio: "BP-2026-0156",
      client: { name: "Vicente Peña Obrador", phone: "5555555555", email: "vicente.po@mail.com" },
      products: [
        { name: "Capuchino Premium", qty: 1, price: 490, image: "images/pastel-capuchino.jpg" },
        { name: "Trufa de Chocolate", qty: 20, price: 45, image: "images/pastel-chocolate.jpg" }
      ],
      flavor: "Capuchino",
      decoration: "Obleas",
      size: "Grande + 20 trufas",
      notes: "Evento importante. Presentación impecable. Entregar con moño dorado.",
      priority: "urgent",
      status: "pendiente",
      createdAt: d(0, 6, 0),
      deliveryDate: d(1, 12, 0),
      total: 1390,
      assignedTo: null,
      timeline: [
        { status: "pendiente", date: d(0, 6, 0), note: "Pedido recibido por teléfono" }
      ]
    }
  ];
})();
