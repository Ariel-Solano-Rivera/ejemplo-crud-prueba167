// server.js
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 9000 });

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

    // OPCIONAL: LISTAR MAYORES A 65 DESDE BD
    if (datos.tipo === "listar65") {
      // const mayores = await obtenerMayores65();
      // enviarATodos({ tipo: "mayores65", data: mayores });
    }
  });
});

console.log("Servidor WebSocket en ws://localhost:9000");
