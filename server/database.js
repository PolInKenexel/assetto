import dotenv from 'dotenv';
import mysql from 'mysql2';
dotenv.config();

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise();

/*--- CRUD ---*/

// Create


// Read
export async function getCancionByID(id) {
    const [rows] = await pool.query(
        `SELECT * FROM canciones WHERE id_cancion = ?`,
        [id]
    );
    return rows[0];
}

export async function getCancionesByUsuarioID(id) {
    const [rows] = await pool.query(
        `SELECT *
         FROM canciones
         WHERE id_usuario = ?`,
        [id]
    );

    console.log(rows);
}

export async function getCategoriasByUsuarioID(id) {
    const [rows] = await pool.query(
        `SELECT *
         FROM categorias
         WHERE id_usuario = ?`,
        [id]
    );

    return rows;
}

getCancionesByUsuarioID(1);

// Update

// Delete