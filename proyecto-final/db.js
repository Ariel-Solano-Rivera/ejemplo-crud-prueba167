// db.js
const { Pool } = require("pg");

const pool = new Pool({
  host: "postgres",
  user: "admin",
  password: "admin",
  database: "control",
  port: 5432
});

// INSERTAR
async function insertarPersonaBD(p) {
  await pool.query(
    `INSERT INTO personas (nombre, cedula, lugar, pais, edad)
     VALUES ($1,$2,$3,$4,$5)`,
    [p.nombre, p.cedula, p.lugar, p.pais, p.edad]
  );
}

// OBTENER MAYORES DE 65
async function obtenerMayores65() {
  const res = await pool.query(
    "SELECT * FROM personas WHERE edad > 65"
  );
  return res.rows;
}

module.exports = { insertarPersonaBD, obtenerMayores65 };
