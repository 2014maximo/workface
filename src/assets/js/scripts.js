//Para evitar conflictos con versiones de Jquery entre wordpress y sus plugins
/* $=jQuery.noConflict(); */



function openNav() {
    document.getElementById("myNav").style.width = "100%";
  }
  
  function closeNav() {
    document.getElementById("myNav").style.width = "0%";
  }
  
  function menuUno(menu, ancho){
      document.getElementById(menu).style.width = ancho;
  }
  
  function cierreMenu(menu) {
      document.getElementById(menu).style.width = "0";
  }
  
  function abrirUrl(url) {
      window.open(url);
  }
  
  function copiarAlPortapapeles(id_elemento) {
    var aux = document.createElement("input");
    aux.setAttribute("value", (document.getElementById(id_elemento).innerHTML).trim());
    document.body.appendChild(aux);
    aux.select();
    document.execCommand("copy");
    document.body.removeChild(aux);
  }
  
  const menuBtn = document.querySelector(".menu-btn");
  let menuOpen = false;
  
  if(menuBtn){
    menuBtn.addEventListener("click", () => {
    if (!menuOpen) {
      menuBtn.classList.add("open");
      menuOpen = true;
    } else {
      menuBtn.classList.remove("open");
      menuOpen = false;
    }
    });
  }
  