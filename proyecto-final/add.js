// add.js - Servicio que expone endpoints HTTP para agregar/editar/borrar
const express = require('express');
// use express.json() for parsing JSON bodies
const WebSocket = require('ws');

const app = express();
app.use(express.json());

// Habilitar CORS simple
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Cliente WebSocket para comunicarse con el servicio de list
let wsClient;
let connected = false;
const LIST_WS = process.env.LIST_WS || 'ws://list:9000';

function connectWs() {
  console.log('Intentando conectar a list-service:', LIST_WS);
  wsClient = new WebSocket(LIST_WS);
  wsClient.on('open', () => {
    connected = true;
    console.log('Conectado a list-service');
  });
  wsClient.on('close', () => {
    connected = false;
    console.log('Desconectado de list-service, reintentando en 1s');
    setTimeout(connectWs, 1000);
  });
  wsClient.on('error', (err) => {
    connected = false;
    console.error('WS error', err.message);
    wsClient.close();
  });
}

connectWs();

function sendToList(data) {
  if (!connected) return false;
  wsClient.send(JSON.stringify(data));
  return true;
}

// Endpoints REST - reciben datos del formulario y los reenvían por WS al list
app.post('/add', (req, res) => {
  const body = req.body;
  if (!body.nombre || !body.cedula) return res.status(400).send({ error: 'Faltan campos' });
  const msg = { tipo: 'agregar', nombre: body.nombre, cedula: body.cedula, lugar: body.lugar, pais: body.pais, edad: body.edad };
  const ok = sendToList(msg);
  if (!ok) return res.status(503).send({ error: 'No conectado a list' });
  return res.send({ status: 'ok' });
});

app.delete('/delete/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).send({ error: 'ID inválido' });
  const ok = sendToList({ tipo: 'borrar', id });
  if (!ok) return res.status(503).send({ error: 'No conectado a list' });
  return res.send({ status: 'ok' });
});

app.put('/edit/:id', (req, res) => {
  const id = Number(req.params.id);
  const updates = req.body;
  if (!id) return res.status(400).send({ error: 'ID inválido' });
  if (!updates) return res.status(400).send({ error: 'No hay datos' });
  const ok = sendToList({ tipo: 'editar', id, updates });
  if (!ok) return res.status(503).send({ error: 'No conectado a list' });
  return res.send({ status: 'ok' });
});

const PORT = process.env.PORT || 9001;
app.listen(PORT, () => console.log('Add service listening on port', PORT));

module.exports = { app };
