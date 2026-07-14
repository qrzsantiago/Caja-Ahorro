// --- BASE DE DATOS LOCAL (SIMULADA) ---
let socios = JSON.parse(localStorage.getItem('cajaSocios')) || [
    { id: 1, nombre: "Juan Pérez García", tipo: "Socios Fundadores", estadoSocial: "verde", ahorros: 15000, creditos: 0 },
    { id: 2, nombre: "María López Solis", tipo: "Socios", estadoSocial: "amarillo", ahorros: 8500, creditos: 5000 },
    { id: 3, nombre: "Carlos Ruiz", tipo: "Socios Menores", estadoSocial: "rojo", ahorros: 1200, creditos: 0 }
];

let socioActualSeleccionado = null;

// --- NAVEGACIÓN MENÚ HAMBURGUESA ---
const btnMenu = document.getElementById('btn-menu');
const menuLateral = document.getElementById('menu-lateral');
const overlayMenu = document.getElementById('overlay-menu');
const navBtns = document.querySelectorAll('.nav-btn');
const tituloSeccion = document.getElementById('titulo-seccion');

function toggleMenu() {
    menuLateral.classList.toggle('oculto');
    overlayMenu.classList.toggle('oculto');
}

btnMenu.addEventListener('click', toggleMenu);
overlayMenu.addEventListener('click', toggleMenu);

navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const target = e.target.getAttribute('data-target');
        document.querySelectorAll('.vista').forEach(vista => vista.classList.remove('activa'));
        document.getElementById(target).classList.add('activa');
        tituloSeccion.textContent = e.target.textContent.split(" ")[0]; // Solo la primera palabra
        
        if(!menuLateral.classList.contains('oculto')) toggleMenu();
        if(target === 'seccion-socios') renderizarDirectorio();
        if(target === 'seccion-inicio') actualizarDashboard();
        actualizarSelects();
    });
});

// --- DASHBOARD Y GRÁFICA ---
function actualizarDashboard() {
    let tAhorros = socios.reduce((sum, s) => sum + s.ahorros, 0);
    let tCreditos = socios.reduce((sum, s) => sum + s.creditos, 0);
    let tDisponible = tAhorros - tCreditos;

    document.getElementById('total-disponible').textContent = `$${tDisponible.toLocaleString()}`;
    document.getElementById('total-creditos').textContent = `$${tCreditos.toLocaleString()}`;
    document.getElementById('total-ahorros').textContent = `$${tAhorros.toLocaleString()}`;

    // Gráfica Mensual (Chart.js)
    const ctx = document.getElementById('grafica-flujo').getContext('2d');
    if(window.miGrafica) window.miGrafica.destroy();
    window.miGrafica = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Ahorros Generados', 'Créditos Otorgados'],
            datasets: [{
                data: [tAhorros, tCreditos],
                backgroundColor: ['#6B21A8', '#9333EA']
            }]
        },
        options: { cutout: '70%', plugins: { legend: { position: 'bottom' } } }
    });

    generarWidgetMesSiguiente();
}

// --- WIDGET MES SIGUIENTE (Primera Semana) ---
function generarWidgetMesSiguiente() {
    const tira = document.getElementById('tira-widget');
    tira.innerHTML = "";
    
    let hoy = new Date();
    // Calcular mes siguiente (Día 1)
    let mesSig = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
    
    const opcionesMes = { month: 'long' };
    document.getElementById('mes-siguiente-nombre').textContent = mesSig.toLocaleDateString('es-ES', opcionesMes).toUpperCase();

    // Generar los primeros 7 días
    const nombresDias = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    for(let i = 1; i <= 7; i++) {
        let fecha = new Date(mesSig.getFullYear(), mesSig.getMonth(), i);
        let diaNombre = nombresDias[fecha.getDay()];
        
        let htmlDia = `
            <div class="dia-widget">
                <p>${diaNombre}</p>
                <h4>${i}</h4>
                <div class="indicadores-widget">
                    ${i === 1 || i === 5 ? '<span class="punto-noti noti-credito"></span>' : ''} <!-- Datos simulados -->
                    ${i === 1 || i === 3 ? '<span class="punto-noti noti-retiro"></span>' : ''}
                </div>
            </div>
        `;
        tira.innerHTML += htmlDia;
    }
}

// --- DIRECTORIO DE SOCIOS ---
function renderizarDirectorio() {
    const lFundadores = document.getElementById('lista-fundadores');
    const lNormales = document.getElementById('lista-normales');
    const lMenores = document.getElementById('lista-menores');
    
    lFundadores.innerHTML = ""; lNormales.innerHTML = ""; lMenores.innerHTML = "";

    socios.forEach(socio => {
        let li = document.createElement('li');
        li.innerHTML = `<span>${socio.nombre}</span> <span class="bolita-estado estado-${socio.estadoSocial}"></span>`;
        li.onclick = () => abrirLibreta(socio);

        if(socio.tipo === "Socios Fundadores") lFundadores.appendChild(li);
        if(socio.tipo === "Socios") lNormales.appendChild(li);
        if(socio.tipo === "Socios Menores") lMenores.appendChild(li);
    });
}

function abrirLibreta(socio) {
    socioActualSeleccionado = socio;
    document.getElementById('libreta-nombre').textContent = socio.nombre;
    document.getElementById('libreta-tipo').textContent = socio.tipo;
    document.getElementById('libreta-estado-social').className = `bolita-estado estado-${socio.estadoSocial}`;
    document.getElementById('libreta-saldo').textContent = `$${socio.ahorros.toLocaleString()}`;
    document.getElementById('libreta-deuda').textContent = `$${socio.creditos.toLocaleString()}`;
    
    document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa'));
    document.getElementById('seccion-libreta').classList.add('activa');
    tituloSeccion.textContent = "Libreta";
}

// --- DESCARGAR PDF (jsPDF) ---
document.getElementById('btn-descargar-pdf').addEventListener('click', () => {
    if(!socioActualSeleccionado) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setTextColor(107, 33, 168); // Morado
    doc.text("Caja de Ahorro - Libreta Oficial", 20, 20);
    
    doc.setFontSize(16);
    doc.setTextColor(0,0,0);
    doc.text(`Socio: ${socioActualSeleccionado.nombre}`, 20, 40);
    doc.text(`Categoría: ${socioActualSeleccionado.tipo}`, 20, 50);
    
    doc.setFontSize(14);
    doc.text(`Saldo Ahorrado: $${socioActualSeleccionado.ahorros.toLocaleString()}`, 20, 70);
    doc.text(`Crédito Activo: $${socioActualSeleccionado.creditos.toLocaleString()}`, 20, 80);
    
    doc.save(`Libreta_${socioActualSeleccionado.nombre.replace(/ /g, '_')}.pdf`);
});

// --- OPERACIONES: AHORROS (Validación estricta) ---
document.getElementById('form-ahorro').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = parseInt(document.getElementById('select-socio-ahorro').value);
    const monto = parseFloat(document.getElementById('monto-ahorro').value);
    const errorMsg = document.getElementById('error-ahorro');
    
    const socio = socios.find(s => s.id === id);
    errorMsg.textContent = "";

    let minPermitido = (socio.tipo === "Socios Menores") ? 200 : 500;

    if(monto < minPermitido) {
        errorMsg.textContent = `Error: El monto mínimo para ${socio.tipo} es de $${minPermitido}.`;
        return;
    }

    socio.ahorros += monto;
    localStorage.setItem('cajaSocios', JSON.stringify(socios));
    alert(`Depósito exitoso. Nuevo saldo: $${socio.ahorros}`);
    e.target.reset();
});

// --- OPERACIONES: CRÉDITOS (Saldo Insoluto) ---
document.getElementById('btn-calcular-credito').addEventListener('click', () => {
    let monto = parseFloat(document.getElementById('monto-credito').value);
    let tasa = parseFloat(document.getElementById('tasa-credito').value) / 100;
    let meses = parseInt(document.getElementById('meses-credito').value);

    if(!monto || !tasa || !meses) return alert("Llena todos los campos");

    // Cálculo sobre saldo insoluto (Amortización constante de capital)
    let abonoCapital = monto / meses;
    let primerInteres = monto * tasa;
    let primerPago = abonoCapital + primerInteres;
    
    // El último interés es sobre el último abono
    let ultimoInteres = abonoCapital * tasa;
    let ultimoPago = abonoCapital + ultimoInteres;

    document.getElementById('calculo-insoluto').innerHTML = `
        <h4 style="color:var(--primario); margin-bottom:10px;">Proyección de Pagos</h4>
        <p>Abono fijo a capital: <b>$${abonoCapital.toFixed(2)}/mes</b></p>
        <p>Primer pago mensual (Capital + Interés): <b>$${primerPago.toFixed(2)}</b></p>
        <p>Último pago mensual: <b>$${ultimoPago.toFixed(2)}</b></p>
        <p style="margin-top:10px; font-size:14px;"><i>*El interés disminuirá cada mes ya que se calcula sobre el capital restante.</i></p>
    `;
});

// --- CALENDARIO MULTIANUAL ---
let fechaCalendario = new Date();

function renderizarCalendario() {
    const cuadricula = document.getElementById('cuadricula-calendario');
    const tituloMes = document.getElementById('mes-año-actual');
    
    let mes = fechaCalendario.getMonth();
    let año = fechaCalendario.getFullYear();
    
    tituloMes.textContent = new Date(año, mes, 1).toLocaleDateString('es-ES', {month:'long', year:'numeric'}).toUpperCase();
    
    cuadricula.innerHTML = "";
    
    let primerDia = new Date(año, mes, 1).getDay();
    let diasEnMes = new Date(año, mes + 1, 0).getDate(); // Maneja bisiestos automático

    for(let i=0; i<primerDia; i++) {
        cuadricula.innerHTML += `<div></div>`; // Espacios vacíos
    }

    for(let i=1; i<=diasEnMes; i++) {
        let esDia1 = (i === 1); // Simulamos solicitudes los días 1
        let esDia15 = (i === 15);
        
        let htmlBurbujas = "";
        if(esDia1) htmlBurbujas += `<div class="burbuja-notificacion c">C: 3</div><div class="burbuja-notificacion r">R: 2</div>`;
        if(esDia15) htmlBurbujas += `<div class="burbuja-notificacion c">C: 1</div>`;

        cuadricula.innerHTML += `
            <div class="dia-cal" onclick="abrirDetalleDia(${i}, ${mes}, ${año}, ${esDia1}, ${esDia15})">
                ${i}
                ${htmlBurbujas}
            </div>
        `;
    }
}

document.getElementById('mes-prev').addEventListener('click', () => { fechaCalendario.setMonth(fechaCalendario.getMonth() - 1); renderizarCalendario(); });
document.getElementById('mes-next').addEventListener('click', () => { fechaCalendario.setMonth(fechaCalendario.getMonth() + 1); renderizarCalendario(); });

function abrirDetalleDia(dia, mes, año, tieneC, tieneR) {
    const detalle = document.getElementById('detalle-dia-calendario');
    document.getElementById('titulo-dia-detalle').textContent = `Movimientos: ${dia}/${mes+1}/${año}`;
    
    document.getElementById('cant-creditos-dia').textContent = tieneC ? "3" : "0";
    document.getElementById('cant-retiros-dia').textContent = tieneR ? "2" : "0";
    
    // Simular lista de personas
    document.getElementById('lista-creditos-dia').innerHTML = tieneC ? `<li>Juan Pérez García</li><li>María López Solis</li>` : `<li>Sin solicitudes</li>`;
    document.getElementById('lista-retiros-dia').innerHTML = tieneR ? `<li>Carlos Ruiz</li>` : `<li>Sin solicitudes</li>`;
    
    detalle.classList.remove('oculto');
}

// Utilidad para llenar los selects (listas desplegables) de los formularios
function actualizarSelects() {
    let opciones = `<option value="">Selecciona un socio...</option>` + socios.map(s => `<option value="${s.id}">${s.nombre}</option>`).join("");
    document.getElementById('select-socio-ahorro').innerHTML = opciones;
    document.getElementById('select-socio-credito').innerHTML = opciones;
    document.getElementById('select-socio-retiro').innerHTML = opciones;
}

// Inicializar la app
actualizarDashboard();
renderizarCalendario();
