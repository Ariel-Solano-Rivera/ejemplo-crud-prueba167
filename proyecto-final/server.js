// server.js
const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let registros = []; // lista temporal en memoria

// ------- OPCIONAL BD --------
// const { obtenerMayores65, insertarPersonaBD } = require("./db");
// ----------------------------

function enviarATodos(data) {
  const json = JSON.stringify(data);
  wss.clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN) c.send(json);
  });
}

wss.on("connection", (ws) => {
  console.log("Cliente conectado");

  // enviar lista completa al nuevo cliente
  ws.send(JSON.stringify({ tipo: "lista", data: registros }));

  ws.on("message", async (msg) => {
    const datos = JSON.parse(msg);

    // AGREGAR REGISTRO
    if (datos.tipo === "agregar") {
      const item = {
        id: Date.now(),
        nombre: datos.nombre,
        cedula: datos.cedula,
        lugar: datos.lugar,
        pais: datos.pais,
        edad: datos.edad,
        fecha: new Date().toISOString()
      };

      registros.push(item);

      // OPCIONAL: guardar en BD
      // await insertarPersonaBD(item);

      enviarATodos({ tipo: "agregar", item });
    }

    // BORRAR REGISTRO
    if (datos.tipo === "borrar") {
      registros = registros.filter(r => r.id !== datos.id);
      enviarATodos({ tipo: "borrar", id: datos.id });
    }

    // EDITAR REGISTRO
    if (datos.tipo === "editar") {
      const i = registros.findIndex(r => r.id === datos.id);
      if (i !== -1) {
        registros[i] = { ...registros[i], ...datos.updates };
        enviarATodos({ tipo: "editar", id: datos.id, updates: datos.updates });
      }
    }

    // OPCIONAL: LISTAR MAYORES A 65 DESDE BD
    if (datos.tipo === "listar65") {
      // const mayores = await obtenerMayores65();
      // enviarATodos({ tipo: "mayores65", data: mayores });
    }
  });
});

// Servir archivos estáticos (dashboard.html y demás) desde el directorio del proyecto.
app.use(express.static(path.join(__dirname)));

// Servir dashboard.html en la raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Iniciar el servidor HTTP (y WebSocket) en el puerto 9000
const PORT = process.env.PORT || 9000;
server.listen(PORT, () => {
  console.log(`Servidor HTTP & WebSocket en http://localhost:${PORT}`);
});
