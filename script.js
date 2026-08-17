// =========================================
// 1. CONFIGURACIÓN (SUPABASE Y NUEVO DRIVE)
// ==========================================
// 1. SUPABASE (Login y Usuarios)
const SUPABASE_URL = 'https://nybdoaclmzdfqeaefgxx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55YmRvYWNsbXpkZnFlYWVmZ3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzA3MzcsImV4cCI6MjA3OTQwNjczN30.OXHa-I76w8JLOtJq9KgrYhAgvrlz1F7UZmKc_IrBp8Y'; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. GOOGLE DRIVE (TU NUEVA URL)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxeGWcYWi9Xp0RDgXKIZmwVK9abDDnRThplaLEgOlSKbCaVFmydcQ7r7Bfk4ftL31aYEw/exec"; 

/* =========================================
   2. SISTEMA DE LOGIN Y UI
   ========================================= */
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

if(signUpButton && signInButton && container) {
    signUpButton.addEventListener('click', () => container.classList.add("right-panel-active"));
    signInButton.addEventListener('click', () => container.classList.remove("right-panel-active"));
}

function cambiarPanel() { 
    if(container) container.classList.toggle("right-panel-active"); 
}

// REGISTRO
async function registrarUsuario() {
    const pin = document.getElementById('reg-pin').value;
    const user = document.getElementById('reg-user').value;
    const pass = document.getElementById('reg-pass').value;
    const msg = document.getElementById('msg-reg');

    if (pin !== "124112") {
        msg.style.display = "block"; msg.innerText = "⛔ PIN INCORRECTO."; return;
    }
    if (!user || !pass) {
        msg.style.display = "block"; msg.innerText = "⚠️ Faltan datos."; return;
    }

    msg.innerText = "Creando..."; msg.style.display = "block"; msg.style.color = "var(--texto)";

    try {
        const { error } = await _supabase.from('usuarios_db').insert([{ usuario: user, password: pass }]);
        if (error) throw error;
        alert("✅ Cuenta creada. Inicia sesión.");
        container.classList.remove("right-panel-active");
        document.getElementById('reg-pin').value = "";
        document.getElementById('reg-pass').value = "";
    } catch (error) { 
        msg.innerText = "❌ Error: Usuario existente."; 
        msg.style.color = "#ff6b6b";
    }
}

// LOGIN
async function iniciarSesion() {
    const user = document.getElementById('log-user').value;
    const pass = document.getElementById('log-pass').value;
    const msg = document.getElementById('msg-login');

    if (!user || !pass) { msg.style.display = "block"; msg.innerText = "⚠️ Faltan datos."; return; }
    msg.innerText = "Verificando..."; msg.style.display = "block"; msg.style.color = "var(--texto)";

    try {
        const { data, error } = await _supabase.from('usuarios_db').select('*').eq('usuario', user).eq('password', pass);
        if (error) throw error;

        if (data.length > 0) {
            localStorage.setItem('usuarioActivo', data[0].usuario);
            aplicarNombreUsuario(data[0].usuario);
            if (data[0].avatar_url) {
                localStorage.setItem('fotoUsuario', data[0].avatar_url);
                cargarAvatar();
            }
            document.getElementById('login-overlay').style.display = 'none';
        } else {
            msg.innerText = "🚫 Incorrecto."; msg.style.color = "#ff6b6b";
        }
    } catch (error) { msg.innerText = "Error de conexión."; }
}

function aplicarNombreUsuario(nombre) {
    const ids = ['nombre-sidebar', 'nombre-header', 'nombre-ajustes'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.innerText = nombre;
    });
}

function cerrarSesion() {
    if(confirm("¿Cerrar sesión?")) {
        localStorage.removeItem('usuarioActivo');
        location.reload();
    }
}

/* =========================================
   3. FOTO DE PERFIL
   ========================================= */
async function subirFotoPerfil() {
    const input = document.getElementById('input-avatar');
    const img = document.getElementById('img-avatar');
    const usuario = localStorage.getItem('usuarioActivo');

    if (!usuario || input.files.length === 0) return;

    const file = input.files[0];
    const ext = file.name.split('.').pop();
    const filePath = `avatares/avatar_${usuario}_${Date.now()}.${ext}`;

    try {
        img.style.opacity = "0.5";
        const { error: uploadError } = await _supabase.storage.from('REPO').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = _supabase.storage.from('REPO').getPublicUrl(filePath);
        const publicURL = urlData.publicUrl;

        await _supabase.from('usuarios_db').update({ avatar_url: publicURL }).eq('usuario', usuario);

        img.src = publicURL; 
        localStorage.setItem('fotoUsuario', publicURL); 
        alert("¡Foto actualizada!");
    } catch (error) { console.error(error); alert("Error al subir foto."); } 
    finally { img.style.opacity = "1"; }
}

function cargarAvatar() {
    const fotoLocal = localStorage.getItem('fotoUsuario');
    const img = document.getElementById('img-avatar');
    if (fotoLocal && img) img.src = fotoLocal;
}

async function sincronizarPerfil() {
    const usuario = localStorage.getItem('usuarioActivo');
    if (!usuario) return;
    try {
        const { data } = await _supabase.from('usuarios_db').select('avatar_url').eq('usuario', usuario).single();
        if (data && data.avatar_url) {
            const img = document.getElementById('img-avatar');
            if (img) { img.src = data.avatar_url + '?t=' + Date.now(); localStorage.setItem('fotoUsuario', data.avatar_url); }
        }
    } catch (e) {}
}

/* =========================================
   4. NAVEGACIÓN Y TEMA
   ========================================= */
function mostrarMateria(id, btn) {
    document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    
    document.querySelectorAll('.toque').forEach(b => b.classList.remove('activo'));
    if(btn) btn.classList.add('activo');
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    if(document.body.classList.contains('dark-mode')){
        localStorage.setItem('temaDavis', 'dark');
    } else {
        localStorage.setItem('temaDavis', 'light');
    }
}
if (localStorage.getItem('temaDavis') === 'dark') { document.body.classList.add('dark-mode'); }

/* =========================================
   5. WIDGETS VARIOS (Reloj, Tareas, Calculadora)
   ========================================= */
setInterval(() => { 
    const r = document.getElementById('reloj-digital'); 
    if(r) r.innerText = new Date().toLocaleTimeString(); 
}, 1000);

// Tareas
let tareas = JSON.parse(localStorage.getItem('tareasDavis')) || [];
renderTareas();
function agregarTarea() { 
    const input = document.getElementById('input-tarea'); 
    if (input.value) { 
        tareas.push({ id: Date.now(), txt: input.value }); 
        input.value = ""; 
        guardarTareas(); 
    } 
}
function borrarTarea(id) { tareas = tareas.filter(t => t.id !== id); guardarTareas(); }
function guardarTareas() { localStorage.setItem('tareasDavis', JSON.stringify(tareas)); renderTareas(); }
function renderTareas() { 
    const lista = document.getElementById('lista-tareas'); 
    if(!lista) return; 
    lista.innerHTML = ""; 
    tareas.forEach(t => { 
        lista.innerHTML += `
        <li>
            <span>${t.txt}</span>
            <button class="aro" onclick="borrarTarea(${t.id})" style="width: 35px; height: 35px; font-size: 16px; color: #ff6b6b;"><i class='bx bx-trash'></i></button>
        </li>`; 
    }); 
}

// Notas
const notas = document.getElementById('mi-bloc-notas');
if(notas) {
    notas.value = localStorage.getItem('notasDavis') || "";
    notas.addEventListener('input', () => {
        localStorage.setItem('notasDavis', notas.value);
        const estado = document.getElementById('estado-notas');
        estado.style.opacity = 1;
        setTimeout(() => estado.style.opacity = 0, 1000);
    });
}

// Calculadora
const pant = document.getElementById('calc-screen');
function appendCalc(v) { if(pant) pant.value += v; }
function limpiarCalc() { if(pant) pant.value = ""; }
function borrarUno() { if(pant) pant.value = pant.value.slice(0,-1); }
function calcularResult() { try { if(pant) pant.value = eval(pant.value); } catch { if(pant) pant.value = "Error"; } }

// Promedio
function calcularPromedio() { 
    const n1 = parseFloat(document.getElementById('nota1').value);
    const n2 = parseFloat(document.getElementById('nota2').value);
    const res = document.getElementById('resultado-notas'); 
    if (isNaN(n1) || isNaN(n2)) { res.innerText = "Faltan notas"; return; } 
    const falta = (6.0 * 3) - n1 - n2; 
    if (falta <= 0) { res.innerHTML = "¡Pasaste! 🎉"; res.style.color = "#00b894"; } 
    else { res.innerHTML = `Necesitas un: ${falta.toFixed(2)}`; res.style.color = "var(--texto)"; } 
}

/* =========================================
   6. APIS (Clima, Bitcoin, Red)
   ========================================= */
async function obtenerClima() { 
    try { 
        const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=13.6929&longitude=-89.2182&current_weather=true'); 
        const d = await r.json(); 
        document.getElementById('temp-actual').innerText = `${Math.round(d.current_weather.temperature)}°C`; 
        document.getElementById('clima-desc').innerText = "San Salvador";
    } catch (e) {} 
}
async function obtenerBitcoin() { 
    try { 
        const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'); 
        const d = await r.json(); 
        document.getElementById('btc-price').innerText = `$${d.bitcoin.usd}`; 
    } catch (e) {} 
}
async function obtenerInfoRed() { 
    try { 
        const r = await fetch('https://ipapi.co/json/'); 
        const d = await r.json(); 
        document.getElementById('my-ip').innerText = d.ip; 
        document.getElementById('my-isp').innerText = d.org; 
    } catch(e){} 
}

/* =========================================
   7. GOOGLE DRIVE SCRIPT (ACTUALIZADO)
   ========================================= */
async function loadDocuments(isBackground = false) {
    const lista = document.getElementById("documents-list");
    const searchInput = document.getElementById("search-docs");
    if (!lista) return;

    if (!isBackground) lista.innerHTML = "<li style='text-align:center;'>Cargando archivos desde Google Drive...</li>";

    try {
        const res = await fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify({ action: "read" }) });
        const data = await res.json();
        
        if (data.result !== "success") { if (!isBackground) lista.innerHTML = "<li>Error cargando archivos</li>"; return; }

        let archivos = data.items;
        const termino = searchInput ? searchInput.value.toLowerCase() : "";

        if (termino !== "") {
            archivos = archivos.filter(a => a.name.toLowerCase().includes(termino) || a.folder.toLowerCase().includes(termino));
        }

        lista.innerHTML = ""; 
        if (archivos.length === 0) { lista.innerHTML = "<li>Sin resultados</li>"; return; }

        const grupos = {};
        archivos.forEach(a => {
            if (!grupos[a.folder]) grupos[a.folder] = [];
            grupos[a.folder].push(a);
        });

        for (const folder in grupos) {
            const title = document.createElement("h3");
            title.textContent = `📂 ${folder}`;
            title.style.marginTop = "20px";
            title.style.color = "var(--brillo)";
            lista.appendChild(title);

            grupos[folder].forEach(a => {
                const li = document.createElement("li");
                li.className = "item-file";
                const match = a.url.match(/\/d\/(.+?)\//);
                const download = match ? `https://drive.google.com/uc?export=download&id=${match[1]}` : a.url;

                li.innerHTML = `
                    <span style="font-weight:600;">${a.name}</span>
                    <div style="display:flex; gap:10px;">
                        <a href="${a.url}" target="_blank" class="aro" style="width:35px; height:35px; font-size:16px;"><i class='bx bx-show'></i></a>
                        <a href="${download}" class="aro" style="width:35px; height:35px; font-size:16px; color:#00b894;"><i class='bx bx-download'></i></a>
                        <button onclick="deleteDocument('${a.id}')" class="aro" style="width:35px; height:35px; font-size:16px; color:#ff6b6b;"><i class='bx bx-trash'></i></button>
                    </div>`;
                lista.appendChild(li);
            });
        }
    } catch (e) {
        if (!isBackground) lista.innerHTML = "<li>Error de conexión con Google Apps Script</li>";
        console.error(e);
    }
}

async function uploadDocument() {
    const fileInput = document.getElementById("document-file");
    const nameInput = document.getElementById("document-name");
    const folderSelect = document.getElementById("folder-select");
    const newFolder = document.getElementById("new-folder-input");
    const status = document.getElementById("upload-status");

    const file = fileInput.files[0];
    const name = nameInput.value.trim();
    let folder = folderSelect.value;
    if (folder === "nueva") folder = newFolder.value.trim();

    if (!file || !name) { status.innerText = "⚠️ Falta archivo o nombre"; status.style.color = "#ff6b6b"; return; }

    status.innerText = "Subiendo..."; status.style.color = "var(--brillo)";

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const base64 = reader.result.split(",")[1];
        try {
            const res = await fetch(SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify({ action: "upload", filename: name, mimeType: file.type, folderName: folder, file: base64 })
            });

            const data = await res.json();
            if (data.result === "success") {
                status.innerText = "Subido ✔️"; status.style.color = "#00b894";
                fileInput.value = ""; nameInput.value = ""; newFolder.value = "";
                loadDocuments(false); loadFolders(); 
            } else { status.innerText = "Error al subir"; status.style.color = "#ff6b6b"; }
        } catch (e) { status.innerText = "Error de red"; status.style.color = "#ff6b6b"; }
    };
}

async function deleteDocument(id) {
    if (!confirm("¿Eliminar archivo real del Drive?")) return;
    try {
        const res = await fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify({ action: "delete", id }) });
        const data = await res.json();
        if (data.result === "success") { loadDocuments(false); } 
        else { alert("No se pudo eliminar."); }
    } catch(e) {}
}

async function loadFolders() {
    const select = document.getElementById("folder-select");
    if (!select) return;
    const seleccionPrevia = select.value;

    try {
        const res = await fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify({ action: "read" }) });
        const data = await res.json();
        if (data.result !== "success") return;

        select.innerHTML = `<option value="General">📂 General</option><option value="nueva" style="font-weight:bold; color:var(--brillo);">+ Crear Nueva Carpeta...</option>`;

        if (data.folders && data.folders.length > 0) {
            data.folders.forEach(c => {
                if (c !== "General") {
                    const o = document.createElement("option");
                    o.value = c; o.innerText = `📂 ${c}`;
                    select.insertBefore(o, select.firstChild);
                }
            });
        }
        if (seleccionPrevia && seleccionPrevia !== "nueva") {
            const existe = Array.from(select.options).some(op => op.value === seleccionPrevia);
            if(existe) select.value = seleccionPrevia;
        }
    } catch (e) {}
}

function verificarCarpeta() { 
    const s = document.getElementById('folder-select'); 
    const i = document.getElementById('new-folder-input'); 
    i.style.display = (s.value === 'nueva') ? 'block' : 'none'; 
}

function filtrarArchivos() { loadDocuments(true); }

/* =========================================
   8. INICIO (ONLOAD)
   ========================================= */
window.onload = () => {
    const usuarioGuardado = localStorage.getItem('usuarioActivo');
    if (usuarioGuardado) {
        document.getElementById('login-overlay').style.display = 'none';
        aplicarNombreUsuario(usuarioGuardado);
        cargarAvatar();
        sincronizarPerfil();
    }
    
    obtenerClima();
    obtenerBitcoin();
    obtenerInfoRed();
    loadDocuments(false);
    loadFolders();
};
