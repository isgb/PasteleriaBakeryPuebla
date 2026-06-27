const BAKERY_DATA = {
  products: [
    {
      id: 1,
      name: "Red Velvet Clásico",
      category: "pasteles",
      price: 350,
      image: "images/pastel-velvet.jpg",
      description: "Nuestro icónico pastel de terciopelo rojo con capas de bizcocho suave y betún de queso crema artesanal. Un balance perfecto entre dulzura y elegancia.",
      rating: 4.9,
      reviews: 142,
      featured: true,
      ingredients: ["Harina de trigo", "Cacao premium", "Queso crema", "Vainilla natural", "Buttermilk"],
      servings: "8-10 porciones"
    },
    {
      id: 2,
      name: "Capuchino Premium",
      category: "pasteles",
      price: 490,
      image: "images/pastel-capuchino.jpg",
      description: "Pastel de tres leches infusionado con café de Veracruz, cubierto con crema de capuchino y espolvoreado con cacao en polvo. Para los amantes del café.",
      rating: 4.8,
      reviews: 98,
      featured: true,
      ingredients: ["Café de Veracruz", "Tres leches", "Crema batida", "Cacao en polvo"],
      servings: "10-12 porciones"
    },
    {
      id: 3,
      name: "Chocolate Intenso",
      category: "pasteles",
      price: 320,
      image: "images/pastel-chocolate.jpg",
      description: "Pastel de chocolate oscuro con ganache de chocolate belga y nueces caramelizadas. Una experiencia de chocolate puro e intenso.",
      rating: 4.7,
      reviews: 167,
      featured: true,
      ingredients: ["Chocolate belga 70%", "Mantequilla", "Nueces", "Crema de leche"],
      servings: "8-10 porciones"
    },
    {
      id: 4,
      name: "Cookies & Cream",
      category: "pasteles",
      price: 420,
      image: "images/pastel-cookies.jpg",
      description: "Bizcocho de vainilla con trozos de galletas de chocolate y crema de cookies. Decorado con galletas enteras y crema chantilly.",
      rating: 4.6,
      reviews: 89,
      featured: false,
      ingredients: ["Galletas de chocolate", "Crema chantilly", "Vainilla", "Queso crema"],
      servings: "8-10 porciones"
    },
    {
      id: 5,
      name: "Mazapán Artesanal",
      category: "pasteles",
      price: 400,
      image: "images/pastel-mazapan.jpg",
      description: "Pastel con sabor a mazapán de cacahuate, cubierto con fondant artesanal y decorado con figuras de mazapán hechas a mano.",
      rating: 4.8,
      reviews: 73,
      featured: false,
      ingredients: ["Cacahuate", "Azúcar glass", "Fondant", "Esencia de almendra"],
      servings: "8-10 porciones"
    },
    {
      id: 6,
      name: "Mini Red Velvet",
      category: "mini-pasteles",
      price: 85,
      image: "images/pastel-velvet.jpg",
      description: "Versión individual de nuestro famoso Red Velvet. Perfecto para un antojo personal o un detalle especial.",
      rating: 4.7,
      reviews: 203,
      featured: false,
      ingredients: ["Harina", "Cacao", "Queso crema", "Colorante natural"],
      servings: "1 porción"
    },
    {
      id: 7,
      name: "Brownie Capuchino",
      category: "postres",
      price: 65,
      image: "images/pastel-capuchino.jpg",
      description: "Brownie húmedo con swirl de capuchino y trozos de nuez. Ideal para acompañar tu café de la tarde.",
      rating: 4.5,
      reviews: 156,
      featured: false,
      ingredients: ["Café espresso", "Chocolate", "Nuez", "Mantequilla"],
      servings: "1 porción"
    },
    {
      id: 8,
      name: "Trufa de Chocolate",
      category: "postres",
      price: 45,
      image: "images/pastel-chocolate.jpg",
      description: "Trufa artesanal de chocolate oscuro con centro suave de ganache. Cada pieza es una pequeña obra maestra.",
      rating: 4.9,
      reviews: 234,
      featured: true,
      ingredients: ["Chocolate oscuro 70%", "Crema de leche", "Mantequilla", "Cacao en polvo"],
      servings: "1 pieza"
    },
    {
      id: 9,
      name: "Pay de Mazapán",
      category: "pays",
      price: 280,
      image: "images/pastel-mazapan.jpg",
      description: "Pay con base crocante de galleta y relleno cremoso de mazapán con un toque de canela y nuez moscada.",
      rating: 4.6,
      reviews: 67,
      featured: false,
      ingredients: ["Galleta molida", "Mazapán", "Canela", "Crema para batir"],
      servings: "6-8 porciones"
    },
    {
      id: 10,
      name: "Cheesecake Cookies",
      category: "pays",
      price: 350,
      image: "images/pastel-cookies.jpg",
      description: "Cheesecake estilo New York con base de galleta de chocolate y topping generoso de cookies & cream.",
      rating: 4.8,
      reviews: 112,
      featured: false,
      ingredients: ["Queso crema", "Galletas de chocolate", "Crema ácida", "Vainilla natural"],
      servings: "8-10 porciones"
    },
    {
      id: 11,
      name: "Pastel 3 Chocolates",
      category: "pasteles",
      price: 380,
      image: "images/pastel-chocolate.jpg",
      description: "Triple capa de mousse: chocolate blanco, con leche y oscuro. Un viaje por los tres mundos del chocolate.",
      rating: 4.7,
      reviews: 91,
      featured: false,
      ingredients: ["Chocolate blanco", "Chocolate con leche", "Chocolate oscuro", "Gelatina sin sabor"],
      servings: "10-12 porciones"
    },
    {
      id: 12,
      name: "Mini Capuchino",
      category: "mini-pasteles",
      price: 75,
      image: "images/pastel-capuchino.jpg",
      description: "Cupcake de capuchino con frosting de café cremoso y un toque de canela. La dosis perfecta de dulzura.",
      rating: 4.6,
      reviews: 178,
      featured: false,
      ingredients: ["Café espresso", "Crema batida", "Vainilla", "Canela"],
      servings: "1 porción"
    }
  ],

  categories: [
    { id: "all", name: "Todos", icon: "fa-th-large" },
    { id: "pasteles", name: "Pasteles", icon: "fa-birthday-cake" },
    { id: "postres", name: "Postres", icon: "fa-cutlery" },
    { id: "pays", name: "Pays", icon: "fa-pie-chart" },
    { id: "mini-pasteles", name: "Mini", icon: "fa-star" }
  ],

  testimonials: [
    {
      id: 1,
      name: "María García López",
      text: "El pastel de Red Velvet para el cumpleaños de mi hija fue espectacular. Todos los invitados quedaron encantados con el sabor y la presentación. ¡Definitivamente repetiré!",
      rating: 5,
      date: "Hace 2 semanas"
    },
    {
      id: 2,
      name: "Carlos Hernández Ruiz",
      text: "Llevo 3 años pidiendo mis pasteles aquí y nunca me han fallado. La calidad es constante y el servicio al cliente es excelente. Los mejores de Puebla.",
      rating: 5,
      date: "Hace 1 mes"
    },
    {
      id: 3,
      name: "Ana Martínez Soto",
      text: "El cheesecake de cookies es mi favorito absoluto. Lo pido para cada reunión familiar y siempre es un éxito rotundo. Muy recomendable.",
      rating: 4,
      date: "Hace 3 semanas"
    },
    {
      id: 4,
      name: "Roberto López Vega",
      text: "Pedí un pastel personalizado para mi boda y superó todas mis expectativas. Hermoso, delicioso y entregado a tiempo. ¡Gracias Bakery Puebla!",
      rating: 5,
      date: "Hace 2 meses"
    }
  ],

  stats: [
    { label: "Clientes Felices", value: 1248, icon: "fa-users" },
    { label: "Pedidos Entregados", value: 3567, icon: "fa-truck" },
    { label: "Productos", value: 45, icon: "fa-birthday-cake" },
    { label: "Años de Experiencia", value: 13, icon: "fa-trophy" }
  ],

  flavors: ["Chocolate", "Capuchino", "Cookies and Cream", "Mazapán", "Red Velvet", "3 Chocolates"],
  decorations: ["Velas", "Obleas", "Rosas", "Espigas", "Letras", "Fondant"]
};
