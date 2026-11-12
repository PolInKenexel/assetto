import dotenv from 'dotenv';
import mysql from 'mysql2';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

/*--- CRUD ---*/

// CREATE

    // Crear cancion
export async function createCancion(
    idUsuario, nombre, tempo, tonalidades
) {
    const [result] = await pool.query(
        `INSERT INTO canciones
            (id_usuario, nombre, tempo, tonalidades)
         VALUES (?, ?, ?, ?)`,
        [
            idUsuario,
            nombre,
            tempo ?? null,
            JSON.stringify(tonalidades)
        ]
    );

    return getCancionByID(result.insertId);
}

    // Crear categoria
export async function createCategoria(
    idUsuario, nombre, publico = false, tipo = 'genero'
) {
    // Las categorias publicas no pertenecen a ningun usuario.
    const propietario = publico ? null : idUsuario;

    const [result] = await pool.query(
        `INSERT INTO categorias
            (id_usuario, nombre, publico, tipo)
         VALUES (?, ?, ?, ?)`,
        [propietario, nombre, publico, tipo]
    );

    const [rows] = await pool.query(
        `SELECT *
         FROM categorias
         WHERE id_categoria = ?`,
        [result.insertId]
    );

    return rows[0];
}

    // Crear relacion entre categoria-cancion
export async function addCategoriaToCancion(
    idCancion, idCategoria
) {
    // Evita insertar dos veces la misma categoria.
    const [result] = await pool.query(
        `INSERT INTO canciones_categorias
            (id_cancion, id_categoria)
         SELECT ?, ?
         WHERE NOT EXISTS (
             SELECT 1
             FROM canciones_categorias
             WHERE id_cancion = ? AND id_categoria = ?
         )`,
        [idCancion, idCategoria, idCancion, idCategoria]
    );

    return result.affectedRows > 0;
}

    // Crear lista
export async function createLista(idUsuario, nombre) {
    const [result] = await pool.query(
        `INSERT INTO listas (id_usuario, nombre)
         VALUES (?, ?)`,
        [idUsuario, nombre]
    );

    return getListaByID(result.insertId);
}

    // Agregar una cancion a una lista
export async function addCancionToLista(
    idLista, idCancion, grupo = null
) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Bloquea la lista mientras se calcula la siguiente posicion.
        const [listas] = await connection.query(
            `SELECT id_lista
             FROM listas
             WHERE id_lista = ? AND fecha_eliminacion IS NULL
             FOR UPDATE`,
            [idLista]
        );

        if (listas.length === 0) {
            throw new Error('La lista no existe o está en la papelera.');
        }

        const [canciones] = await connection.query(
            `SELECT id_cancion
             FROM canciones
             WHERE id_cancion = ? AND fecha_eliminacion IS NULL`,
            [idCancion]
        );

        if (canciones.length === 0) {
            throw new Error('La canción no existe o está en la papelera.');
        }

        const [posiciones] = await connection.query(
            `SELECT COALESCE(MAX(posicion) + 1, 0) AS siguiente_posicion
             FROM listas_canciones
             WHERE id_lista = ?`,
            [idLista]
        );

        const [result] = await connection.query(
            `INSERT INTO listas_canciones
                (id_lista, id_cancion, posicion, grupo)
             VALUES (?, ?, ?, ?)`,
            [
                idLista,
                idCancion,
                posiciones[0].siguiente_posicion,
                grupo
            ]
        );

        await connection.commit();
        return result.affectedRows > 0;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// READ

    // Obtener una sola cancion por su ID
export async function getCancionByID(id) {
    const [rows] = await pool.query(
        `SELECT *
         FROM canciones
         WHERE id_cancion = ?
           AND fecha_eliminacion IS NULL`,
        [id]
    );

    return rows[0];
}

// Obtener todas las canciones de un usuario
export async function getCancionesByUsuarioID(id) {
    const [rows] = await pool.query(
        `SELECT c.*, 
            (
                SELECT GROUP_CONCAT(cat.nombre SEPARATOR '||')
                FROM canciones_categorias cc
                INNER JOIN categorias cat ON cc.id_categoria = cat.id_categoria
                WHERE cc.id_cancion = c.id_cancion
            ) AS categorias_texto
         FROM canciones c
         WHERE c.id_usuario = ?
           AND c.fecha_eliminacion IS NULL
         ORDER BY c.nombre ASC`,
        [id]
    );

    return rows;
}

    // Obtener todas las categorias de un usuario
export async function getCategoriasByUsuarioID(id) {
    const [rows] = await pool.query(
        `SELECT *
         FROM categorias
         WHERE id_usuario = ?
            OR (id_usuario IS NULL AND publico = TRUE)
         ORDER BY nombre ASC`,
        [id]
    );

    return rows;
}

    // Obtener todas las categorias que tiene una cancion
export async function getCategoriasByCancionID(id) {
    const [rows] = await pool.query(
        `SELECT c.*
         FROM categorias c
         INNER JOIN canciones_categorias cc
             ON c.id_categoria = cc.id_categoria
         INNER JOIN canciones ca
             ON ca.id_cancion = cc.id_cancion
         WHERE cc.id_cancion = ?
           AND ca.fecha_eliminacion IS NULL
         ORDER BY c.nombre ASC`,
        [id]
    );

    return rows;
}

    // Obtener todas las canciones que pertenecen a una categoria
export async function getCancionesByCategoriaID(id) {
    const [rows] = await pool.query(
        `SELECT c.*
         FROM canciones c
         INNER JOIN canciones_categorias cc
             ON c.id_cancion = cc.id_cancion
         WHERE cc.id_categoria = ?
           AND c.fecha_eliminacion IS NULL
         ORDER BY c.nombre ASC`,
        [id]
    );

    return rows;
}

    // Obtener todas las listas de un usuario
export async function getListasByUsuarioID(id) {
    const [rows] = await pool.query(
        `SELECT *
         FROM listas
         WHERE id_usuario = ?
           AND fecha_eliminacion IS NULL
         ORDER BY fecha_creacion DESC`,
        [id]
    );

    return rows;
}

    // Obtener una sola lista por su ID
export async function getListaByID(idLista) {
    const [rows] = await pool.query(
        `SELECT *
         FROM listas
         WHERE id_lista = ?
           AND fecha_eliminacion IS NULL`,
        [idLista]
    );

    return rows[0];
}

    // Obtener todas las canciones que pertenecen a una lista
export async function getCancionesByListaID(idLista) {
    const [rows] = await pool.query(
        `SELECT c.*, lc.posicion, lc.grupo
         FROM canciones c
         INNER JOIN listas_canciones lc
             ON c.id_cancion = lc.id_cancion
         INNER JOIN listas l
             ON l.id_lista = lc.id_lista
         WHERE lc.id_lista = ?
           AND c.fecha_eliminacion IS NULL
           AND l.fecha_eliminacion IS NULL
         ORDER BY lc.posicion ASC`,
        [idLista]
    );

    return rows;
}

    // Obtener todas las canciones que estan en la papelera de un usuario
export async function getCancionesEnPapeleraByUsuarioID(idUsuario) {
    const [rows] = await pool.query(
        `SELECT *
         FROM canciones
         WHERE id_usuario = ?
           AND fecha_eliminacion IS NOT NULL
         ORDER BY fecha_eliminacion DESC`,
        [idUsuario]
    );

    return rows;
}

    // Obtener todas las listas que estan en la papelera de un usuario
export async function getListasEnPapeleraByUsuarioID(idUsuario) {
    const [rows] = await pool.query(
        `SELECT *
         FROM listas
         WHERE id_usuario = ?
           AND fecha_eliminacion IS NOT NULL
         ORDER BY fecha_eliminacion DESC`,
        [idUsuario]
    );

    return rows;
}


// UPDATE

    // Actualizar datos de una cancion
export async function updateCancion(
    id, nombre, tempo, tonalidades
) {
    const [result] = await pool.query(
        `UPDATE canciones
         SET nombre = ?, tempo = ?, tonalidades = ?
         WHERE id_cancion = ?
           AND fecha_eliminacion IS NULL`,
        [
            nombre,
            tempo ?? null,
            JSON.stringify(tonalidades),
            id
        ]
    );

    return result.affectedRows > 0;
}

    // Actualizar el nombre de una lista
export async function updateNombreLista(idLista, nombre) {
    const [result] = await pool.query(
        `UPDATE listas
         SET nombre = ?
         WHERE id_lista = ?
           AND fecha_eliminacion IS NULL`,
        [nombre, idLista]
    );

    return result.affectedRows > 0;
}

    // Cambiar el grupo de una cancion dentro de una lista
export async function updateGrupoCancionEnLista(
    idLista, idCancion, grupo
) {
    const [result] = await pool.query(
        `UPDATE listas_canciones
         SET grupo = ?
         WHERE id_lista = ? AND id_cancion = ?`,
        [grupo, idLista, idCancion]
    );

    return result.affectedRows > 0;
}

    // Reordenar las canciones activas de una lista
export async function reorderCancionesEnLista(
    idLista, idsCancionesOrdenados
) {
    if (!Array.isArray(idsCancionesOrdenados)) {
        throw new TypeError('Se esperaba un array de IDs de canciones.');
    }

    const idsNuevos = idsCancionesOrdenados.map(Number);

    if (
        idsNuevos.some(id => !Number.isSafeInteger(id) || id <= 0) ||
        new Set(idsNuevos).size !== idsNuevos.length
    ) {
        throw new Error('El orden contiene IDs inválidos o canciones repetidas.');
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Bloquear la lista durante el reordenamiento.
        const [listas] = await connection.query(
            `SELECT id_lista
             FROM listas
             WHERE id_lista = ?
               AND fecha_eliminacion IS NULL
             FOR UPDATE`,
            [idLista]
        );

        if (listas.length === 0) {
            throw new Error('La lista no existe o está en la papelera.');
        }

        // Obtener las canciones activas y las que están en la papelera.
        const [actuales] = await connection.query(
            `SELECT lc.id_cancion, lc.posicion,
                    c.fecha_eliminacion
             FROM listas_canciones lc
             INNER JOIN canciones c
                 ON c.id_cancion = lc.id_cancion
             WHERE lc.id_lista = ?
             ORDER BY lc.posicion ASC`,
            [idLista]
        );

        const idsActivos = actuales
            .filter(c => c.fecha_eliminacion === null)
            .map(c => Number(c.id_cancion));

        // El cliente debe enviar exactamente las canciones activas.
        if (
            idsActivos.length !== idsNuevos.length ||
            idsActivos.some(id => !idsNuevos.includes(id))
        ) {
            throw new Error(
                'El nuevo orden debe contener exactamente las canciones activas de la lista.'
            );
        }

        if (actuales.length > 0) {
            // Mover temporalmente TODAS las posiciones por encima
            // del máximo actual para evitar conflictos con UNIQUE.
            const maxPosicion = Math.max(
                ...actuales.map(c => Number(c.posicion))
            );

            const desplazamiento =
                maxPosicion + actuales.length + 1;

            await connection.query(
                `UPDATE listas_canciones
                 SET posicion = posicion + ?
                 WHERE id_lista = ?`,
                [desplazamiento, idLista]
            );

            // Asignar posiciones consecutivas a las canciones activas.
            for (let i = 0; i < idsNuevos.length; i++) {
                await connection.query(
                    `UPDATE listas_canciones
                     SET posicion = ?
                     WHERE id_lista = ?
                       AND id_cancion = ?`,
                    [i, idLista, idsNuevos[i]]
                );
            }

            // Colocar las canciones de la papelera después
            // de todas las canciones activas.
            const idsPapelera = actuales
                .filter(c => c.fecha_eliminacion !== null)
                .map(c => Number(c.id_cancion));

            for (let i = 0; i < idsPapelera.length; i++) {
                await connection.query(
                    `UPDATE listas_canciones
                     SET posicion = ?
                     WHERE id_lista = ?
                       AND id_cancion = ?`,
                    [idsNuevos.length + i, idLista, idsPapelera[i]]
                );
            }
        }

        await connection.commit();
        return true;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}

// DELETE

    // Enviar una cancion a la papelera
export async function moveCancionToTrash(id) {
    const [result] = await pool.query(
        `UPDATE canciones
         SET fecha_eliminacion = CURRENT_TIMESTAMP
         WHERE id_cancion = ?
           AND fecha_eliminacion IS NULL`,
        [id]
    );

    return result.affectedRows > 0;
}

    // Restaurar una canción de la papelera y colocarla al final
export async function restoreCancion(id) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Bloquear la canción para evitar restauraciones simultáneas.
        const [canciones] = await connection.query(
            `SELECT id_cancion
             FROM canciones
             WHERE id_cancion = ?
               AND fecha_eliminacion IS NOT NULL
             FOR UPDATE`,
            [id]
        );

        if (canciones.length === 0) {
            await connection.rollback();
            return false;
        }

        // Restaurar la canción.
        await connection.query(
            `UPDATE canciones
             SET fecha_eliminacion = NULL
             WHERE id_cancion = ?`,
            [id]
        );

        // Obtener las listas activas a las que pertenece.
        const [listas] = await connection.query(
            `SELECT lc.id_lista
             FROM listas_canciones lc
             INNER JOIN listas l
                 ON l.id_lista = lc.id_lista
             WHERE lc.id_cancion = ?
               AND l.fecha_eliminacion IS NULL
             FOR UPDATE`,
            [id]
        );

        // Colocar la canción al final de cada lista.
        for (const lista of listas) {
            const [posiciones] = await connection.query(
                `SELECT COALESCE(MAX(posicion), -1) AS max_posicion
                 FROM listas_canciones
                 WHERE id_lista = ?`,
                [lista.id_lista]
            );

            const siguientePosicion =
                Number(posiciones[0].max_posicion) + 1;

            await connection.query(
                `UPDATE listas_canciones
                 SET posicion = ?
                 WHERE id_lista = ?
                   AND id_cancion = ?`,
                [siguientePosicion, lista.id_lista, id]
            );
        }

        await connection.commit();
        return true;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}

    // Enviar una lista a la papelera
export async function moveListaToTrash(idLista) {
    const [result] = await pool.query(
        `UPDATE listas
         SET fecha_eliminacion = CURRENT_TIMESTAMP
         WHERE id_lista = ?
           AND fecha_eliminacion IS NULL`,
        [idLista]
    );

    return result.affectedRows > 0;
}

    // Restaurar una lista de la papelera
export async function restoreLista(idLista) {
    const [result] = await pool.query(
        `UPDATE listas
         SET fecha_eliminacion = NULL
         WHERE id_lista = ?
           AND fecha_eliminacion IS NOT NULL`,
        [idLista]
    );

    return result.affectedRows > 0;
}

    // Eliminar DEFINITIVAMENTE una cancion
export async function deleteCancion(id) {
    const [result] = await pool.query(
        `DELETE FROM canciones
         WHERE id_cancion = ?`,
        [id]
    );

    return result.affectedRows > 0;
}

    // Eliminar DEFINITIVAMENTE una categoria
export async function deleteCategoria(id) {
    const [result] = await pool.query(
        `DELETE FROM categorias
         WHERE id_categoria = ?`,
        [id]
    );

    return result.affectedRows > 0;
}

    // Eliminar una relacion entre categoria-cancion
export async function removeCategoriaFromCancion(
    idCancion, idCategoria
) {
    const [result] = await pool.query(
        `DELETE FROM canciones_categorias
         WHERE id_cancion = ? AND id_categoria = ?`,
        [idCancion, idCategoria]
    );

    return result.affectedRows > 0;
}

    // Eliminar una relacion entre lista-cancion
export async function removeCancionFromLista(
    idLista, idCancion
) {
    const [result] = await pool.query(
        `DELETE FROM listas_canciones
         WHERE id_lista = ? AND id_cancion = ?`,
        [idLista, idCancion]
    );

    return result.affectedRows > 0;
}

    // Eliminar DEFINITIVAMENTE una lista
export async function deleteLista(idLista) {
    const [result] = await pool.query(
        `DELETE FROM listas
         WHERE id_lista = ?`,
        [idLista]
    );

    return result.affectedRows > 0;
}

/*--- CRUD USUARIOS ---*/

// CREATE

    // Crear un usuario nuevo
export async function createUsuario(
    nombre,
    apellido,
    email,
    passwordHash
) {
    const [result] = await pool.query(
        `INSERT INTO usuarios
            (nombre, apellido, email, password_hash)
         VALUES (?, ?, ?, ?)`,
        [nombre, apellido, email, passwordHash]
    );

    return getUsuarioByID(result.insertId);
}


// READ

    // Obtener datos del usuario por su ID (solo cuentas activas)
export async function getUsuarioByID(id) {
    const [rows] = await pool.query(
        `SELECT
            id_usuario,
            nombre,
            apellido,
            email,
            fecha_creacion
         FROM usuarios
         WHERE id_usuario = ?
           AND fecha_eliminacion IS NULL`,
        [id]
    );

    return rows[0];
}

    // Obtener datos de autenticacion del usuario por su email.
export async function getUsuarioByEmail(email) {
    const [rows] = await pool.query(
        `SELECT
            id_usuario,
            nombre,
            apellido,
            email,
            password_hash,
            fecha_creacion,
            fecha_eliminacion
         FROM usuarios
         WHERE email = ?`,
        [email]
    );

    return rows[0];
}

    // Comprobar si un correo ya ha sido usado en la BD
export async function emailExists(email) {
    const [rows] = await pool.query(
        `SELECT 1
         FROM usuarios
         WHERE email = ?
         LIMIT 1`,
        [email]
    );

    return rows.length > 0;
}


// UPDATE

    // Actualizar los datos del usuario (solo cuentas activas)
export async function updateUsuario(
    id,
    nombre,
    apellido,
    email
) {
    const [result] = await pool.query(
        `UPDATE usuarios
         SET nombre = ?,
             apellido = ?,
             email = ?
         WHERE id_usuario = ?
           AND fecha_eliminacion IS NULL`,
        [nombre, apellido, email, id]
    );

    return result.affectedRows > 0;
}

    // Actualizar la contrasenya del usuario (solo cuentas activas)
export async function updatePasswordHash(id, passwordHash) {
    const [result] = await pool.query(
        `UPDATE usuarios
         SET password_hash = ?
         WHERE id_usuario = ?
           AND fecha_eliminacion IS NULL`,
        [passwordHash, id]
    );

    return result.affectedRows > 0;
}


// DELETE

    // Marcar una cuenta como eliminada; puede recuperarse durante 14 dias
export async function moveUsuarioToTrash(id) {
    const [result] = await pool.query(
        `UPDATE usuarios
         SET fecha_eliminacion = CURRENT_TIMESTAMP
         WHERE id_usuario = ?
           AND fecha_eliminacion IS NULL`,
        [id]
    );

    return result.affectedRows > 0;
}

    // Restaurar una cuenta eliminada dentro del periodo de 14 dias
export async function restoreUsuario(id) {
    const [result] = await pool.query(
        `UPDATE usuarios
         SET fecha_eliminacion = NULL
         WHERE id_usuario = ?
           AND fecha_eliminacion IS NOT NULL
           AND fecha_eliminacion >= CURRENT_TIMESTAMP - INTERVAL 14 DAY`,
        [id]
    );

    return result.affectedRows > 0;
}

    // Eliminar DEFINITIVAMENTE a un usuario
export async function deleteUsuario(id) {
    const [result] = await pool.query(
        `DELETE FROM usuarios
         WHERE id_usuario = ?`,
        [id]
    );

    return result.affectedRows > 0;
}

// Cerrar el pool cuando la aplicacion termine.
export async function closeDatabase() {
    await pool.end();
}

export async function getCancionesDeLista(idLista) {
    const query = `
        SELECT c.*, lc.posicion, lc.grupo 
        FROM canciones c
        INNER JOIN listas_canciones lc ON c.id_cancion = lc.id_cancion
        WHERE lc.id_lista = ?
        ORDER BY lc.posicion ASC
    `;
    
    const [rows] = await pool.query(query, [idLista]);
    return rows;
}