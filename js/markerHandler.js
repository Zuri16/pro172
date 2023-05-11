var tableNumber = null;

AFRAME.registerComponent("markerhandler", {
  init: async function () {
    
    if (tableNumber === null) {
      this.askTableNumber();
    }

    var dishes = await this.getDishes();

    this.el.addEventListener("markerFound", () => {
      
      if (tableNumber !== null) {
        var markerId = this.el.id;
        this.handleMarkerFound(dishes, markerId);
      }
    });
    
    this.el.addEventListener("markerLost", () => {
      this.handleMarkerLost();
    });
  },

  askTableNumber: function () {
    var iconUrl = "https://raw.githubusercontent.com/whitehatjr/menu-card-app/main/hunger.png";
    swal({
      title: "¡Bienvenido a 'La tiendita'!",
      icon: iconUrl,
      content: {
        element: "input",
        attributes: {
          placeholder: "Escribe el número de usuario",
          type: "number",
          min: 1
        }
      },
 
      closeOnClickOutside: false,
      
    }).then(inputValue => {
      tableNumber = inputValue;
    });
  },

  handleMarkerFound: function (dishes, markerId) {
   
    var todaysDate = new Date();
    var todaysDay = todaysDate.getDay();

    var days = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado"
    ];

    var dish = dishes.filter(dish => dish.id === markerId)[0];

    if (!dish.unavailable_days.includes(days[todaysDay])) {
      swal({
        icon: "warning",
        title: dish.nombre.toUpperCase(),
        text: "¡Este juguete no está disponible hoy!",
        timer: 2500,
        buttons: false
      });
    } else {
     
      var model = document.querySelector(`#model-${dish.id}`);
      model.setAttribute("position", dish.model_geometry.position);
      model.setAttribute("rotation", dish.model_geometry.rotation);

      //1.-Variable para elegirlo y guardarlo
      model.setAttribute("scale", dish.model_geometry.scale);
      
      model.setAttribute("visible", true);

      var ingredientsContainer = document.querySelector(`#main-plane-${dish.id}`);
      ingredientsContainer.setAttribute("visible", true);

      var priceplane = document.querySelector(`#price-plane-${dish.id}`);
      priceplane.setAttribute("visible", true)

      var buttonDiv = document.getElementById("button-div");
      buttonDiv.style.display = "flex";

      var ratingButton = document.getElementById("rating-button");
      var orderButtton = document.getElementById("order-button");
      var orderSummaryButtton = document.getElementById("order-summary-button");
      var payButton = document.getElementById("pay-button")

      if (tableNumber != null) {
   
        ratingButton.addEventListener("click", function () {
          swal({
            icon: "warning",
            title: "Calificar juguete",
            text: "Procesando calificación"
          });
        });

        orderButtton.addEventListener("click", () => {
       
          var tNumber;
          
          tableNumber <= 9 ? (tNumber = `U0${tableNumber}`) : `U${tableNumber}`;
       
          this.handleOrder(tNumber, dish);
          
          swal({
            icon: "https://i.imgur.com/4NZ6uLY.jpg",
            title: "¡Gracias por tu orden!",
            text: "¡Recibirás tu juguete pronto!",
            timer: 2000,
            buttons: false
          });
        });
        
        //2.-Agregar su escucha de evento
        orderSummaryButtton.addEventListener("click", () =>
        this.handleOrderSummary()
      );

      payButton.addEventListener("click", ()=> this.handlePayment())

      }
    }
  },
 
  handleOrder: function (tNumber, dish) {
    
    firebase
      .firestore()
      .collection("users")
      .doc(tNumber)
      .get()
      .then(doc => {
        var details = doc.data();


        if (details["current_orders"][dish.id]) {
       
          details["current_orders"][dish.id]["quantity"] += 1;

          var currentQuantity = details["current_orders"][dish.id]["quantity"];

          details["current_orders"][dish.id]["subtotal"] =
            currentQuantity * dish.price;
        } 
        else {
          details["current_orders"][dish.id] = {
            item: dish.nombre,
            price: dish.price,
            quantity: 1,
            subtotal: dish.price * 1
          };
        }
        details.total_bill += dish.price;
        firebase
          .firestore()
          .collection("users")
          .doc(doc.id)
          .update(details);
      });
  },
 
  getDishes: async function () {
    return await firebase
      .firestore()
      .collection("toys")
      .get()
      .then(snap => {
        return snap.docs.map(doc => doc.data());
      });
  },

  //3.-Crear funcion para obtener los detalles segun la mesa
  getOrderSummary: async function (tNumber) {
    return await firebase
      .firestore()
      .collection("users")
      .doc(tNumber)
      .get()
      .then(doc => doc.data());
  },

//4.-Crear función que muestre resumen
  handleOrderSummary: async function () {

    //Obtener el número de mesa
    var tNumber;
    tableNumber <= 9 ? (tNumber = `U0${tableNumber}`) : `U${tableNumber}`;

    //Obtener el resumen del pedido de la base de datos
    var orderSummary = await this.getOrderSummary(tNumber);

    //Cambiar la visibilidad del div modal
    var modalDiv = document.getElementById("modal-div");
    modalDiv.style.display = "flex";

    //Obtener el elemento cuerpo de la tabla
    var tableBodyTag = document.getElementById("bill-table-body");

    //Eliminar datos antiguos de tr(fila de la tabla)
    tableBodyTag.innerHTML = "";

    //Obtener todo lo que tiene el campo current_orders de la mesa elegida
    var currentOrders = Object.keys(orderSummary.current_orders);

    currentOrders.map(i => {

      //Crear la fila de la tabla
      var tr = document.createElement("tr");

      //Crear las columnas de la tabla para NOMBRE DEL ARTÍCULO, PRECIO, CANTIDAD y PRECIO TOTAL
      var item = document.createElement("td");
      var price = document.createElement("td");
      var quantity = document.createElement("td");
      var subtotal = document.createElement("td");

      //Añadir el contenido HTML a las celdas, usando la función innerHTML
      item.innerHTML = orderSummary.current_orders[i].item;

      price.innerHTML = "$" + orderSummary.current_orders[i].price;
      price.setAttribute("class", "text-center");

      quantity.innerHTML = orderSummary.current_orders[i].quantity;
      quantity.setAttribute("class", "text-center");

      subtotal.innerHTML = "$" + orderSummary.current_orders[i].subtotal;
      subtotal.setAttribute("class", "text-center");

      //Añadir las celdas a la fila
      tr.appendChild(item);
      tr.appendChild(price);
      tr.appendChild(quantity);
      tr.appendChild(subtotal);

      //Añadir la fila a la tabla
      tableBodyTag.appendChild(tr);

      var fila_total=document.createElement("tr")
      var colum1 = document.createElement("td")
      colum1.setAttribute("class", "no-line")
      var colum2 = document.createElement("td")
      colum2.setAttribute("class", "no-line")
      var colum3 = document.createElement("td")
      colum1.setAttribute("class", "no-line text-center")
      var textTotal= document.createElement("strong")
      textTotal.innerHTML="Total"
      colum3.appendChild(textTotal)
      var colum4=document.createElement("td")
      colum4.setAttribute("class", "no-line text-right")
      colum4.innerHTML="$"+orderSummary.total_bill
      fila_total.appendChild(colum1)
      fila_total.appendChild(colum2)
      fila_total.appendChild(colum3)
      fila_total.appendChild(colum4)
      tableBodyTag.appendChild(fila_total)

    });
  },
  handlePayment: function(){
    document.getElementById("modal-div").style.display="none"
    var tNumber;
    tableNumber <= 9 ? (tNumber = `U0${tableNumber}`) : `U${tableNumber}`;
    firebase
    .firestore()
    .collection("users")
    .doc(tNumber)
    .update({
      current_orders:{},
      total_bill:0
    })
    .then(()=>{
      swal({
        icon: "success",
        title: "Gracias por su compra",
        text: "Vuelva pronto",
        timer:2500,
        buttons:false
      });
    })
  },
  
  handleMarkerLost: function () {
    // Cambiar la visibilidad del botón div
    var buttonDiv = document.getElementById("button-div");
    buttonDiv.style.display = "none";
  }
});
