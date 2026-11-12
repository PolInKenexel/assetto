/*--- ---*/
//server/app.js
import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import * as db from "./database.js";

dotenv.config();

/*--- CONFIGURACION ---*/
const JWT_SECRET = process.env.JWT_SECRET;

if (
    !JWT_SECRET ||
    Buffer.byteLength(JWT_SECRET, "utf8") < 32
) {
    throw new Error(
        "JWT_SECRET debe existir y tener al menos 32 bytes."
    );
}

const app = express();
const PORT = process.env.PORT || 3000;

const TOKEN_EXPIRATION = "15m";
const TOKEN_EXPIRATION_SECONDS = 15 * 60;

const corsOptions = {
    origin: [
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://localhost:8081" // Permite al navegador de VS Code
    ],
    methods: ["GET", "POST"]
};

/*--- MIDDLEWARES GENERALES ---*/
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "10kb" }));

    // =========================== AUTENTICACION ===========================

/*--- Limitar intentos para autenticarse ---*/
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        return res.status(429).json({
            error:
                "Demasiados intentos. Inténtalo de nuevo en unos minutos."
        });
    }
});

/*--- Crear token (JSON Web Token) de acceso ---*/
function crearTokenAcceso(usuario) {
    return jwt.sign(
        {
            sub: String(usuario.id_usuario)
        },
        JWT_SECRET,
        {
            algorithm: "HS256",
            expiresIn: TOKEN_EXPIRATION,
            issuer: "assetto-api",
            audience: "assetto-app"
        }
    );
}

/*--- Alguna respuesta de la autenticacion (por defecto todo bien) ---*/
function responderAutenticacion(res, usuario, status = 200) {
    const token = crearTokenAcceso(usuario);

    return res.status(status).json({
        usuario,
        token,
        tipo: "Bearer",
        expiresIn: TOKEN_EXPIRATION_SECONDS
    });
}

    // =========================== CRUD DE USUARIOS ===========================

/*--- REGISTRO ---*/
app.post("/auth/register", authLimiter, async (req, res, next) => {
    try {
        const {
            nombre,
            apellido,
            email,
            password
        } = req.body ?? {};

        if (
            typeof nombre !== "string" ||
            typeof apellido !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                error:
                    "Debes proporcionar nombre, apellido, email y contraseña."
            });
        }

        const nombreNormalizado = nombre.trim();
        const apellidoNormalizado = apellido.trim();
        const emailNormalizado = email.trim().toLowerCase();

        if (
            nombreNormalizado.length === 0 ||
            nombreNormalizado.length > 100 ||
            apellidoNormalizado.length === 0 ||
            apellidoNormalizado.length > 100
        ) {
            return res.status(400).json({
                error:
                    "El nombre y el apellido deben tener entre 1 y 100 caracteres."
            });
        }

        const emailValido =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado);

        if (
            !emailValido ||
            emailNormalizado.length > 255
        ) {
            return res.status(400).json({
                error: "El correo electrónico no es válido."
            });
        }

        if (
            password.length < 12 ||
            Buffer.byteLength(password, "utf8") > 72
        ) {
            return res.status(400).json({
                error:
                    "La contraseña debe tener al menos 12 caracteres y no superar los 72 bytes."
            });
        }

        if (await db.emailExists(emailNormalizado)) {
            return res.status(409).json({
                error:
                    "Ya existe una cuenta asociada a ese correo electrónico."
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const usuario = await db.createUsuario(
            nombreNormalizado,
            apellidoNormalizado,
            emailNormalizado,
            passwordHash
        );

        if (!usuario) {
            throw new Error(
                "No se pudo recuperar el usuario recién creado."
            );
        }

        return responderAutenticacion(res, usuario, 201);

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                error:
                    "Ya existe una cuenta asociada a ese correo electrónico."
            });
        }
        next(error);
    }
});

/*--- INICIO DE SESION ---*/
app.post("/auth/login", authLimiter, async (req, res, next) => {
    try {
        const email =
            typeof req.body?.email === "string"
                ? req.body.email.trim().toLowerCase()
                : "";

        const password =
            typeof req.body?.password === "string"
                ? req.body.password
                : "";

        if (!email || !password) {
            return res.status(400).json({
                error: "Debes proporcionar el correo y la contraseña."
            });
        }

        const usuarioBD = await db.getUsuarioByEmail(email);

        const esPasswordTextoPlano = password === usuarioBD?.password_hash;
        
        let esPasswordValido = esPasswordTextoPlano;
        if (!esPasswordValido && usuarioBD) {
            try {
                esPasswordValido = await bcrypt.compare(password, usuarioBD.password_hash);
            } catch (e) {
                esPasswordValido = false;
            }
        }

        if (!usuarioBD || !esPasswordValido) {
            return res.status(401).json({
                error: "Correo o contraseña incorrectos."
            });
        }

        if (usuarioBD.fecha_eliminacion) {
            return res.status(403).json({
                error:
                    "La cuenta está en proceso de eliminación. Puedes intentar recuperarla mediante /auth/restore-account."
            });
        }

        const usuario = await db.getUsuarioByID(
            usuarioBD.id_usuario
        );

        if (!usuario) {
            return res.status(401).json({
                error: "La cuenta no está disponible."
            });
        }

        return responderAutenticacion(res, usuario);

    } catch (error) {
        next(error);
    }
});

/*--- recuperar una cuenta eliminada ---*/
app.post("/auth/restore-account", authLimiter, async (req, res, next) => {
        try {
            const email =
                typeof req.body?.email === "string"
                    ? req.body.email.trim().toLowerCase()
                    : "";

            const password =
                typeof req.body?.password === "string"
                    ? req.body.password
                    : "";

            if (!email || !password) {
                return res.status(400).json({
                    error:
                        "Debes proporcionar el correo y la contraseña."
                });
            }

            const usuarioBD = await db.getUsuarioByEmail(email);

            if (
                !usuarioBD ||
                !(await bcrypt.compare(
                    password,
                    usuarioBD.password_hash
                ))
            ) {
                return res.status(401).json({
                    error: "Correo o contraseña incorrectos."
                });
            }

            if (!usuarioBD.fecha_eliminacion) {
                return res.status(409).json({
                    error: "La cuenta ya está activa."
                });
            }

            const restaurado = await db.restoreUsuario(
                usuarioBD.id_usuario
            );

            if (!restaurado) {
                return res.status(403).json({
                    error:
                        "La cuenta ya no puede recuperarse mediante este procedimiento."
                });
            }

            const usuario = await db.getUsuarioByID(
                usuarioBD.id_usuario
            );

            if (!usuario) {
                throw new Error(
                    "No se pudo recuperar el usuario restaurado."
                );
            }

            return responderAutenticacion(res, usuario);

        } catch (error) {
            next(error);
        }
    }
);

/*--- MIDDLEWARE DE AUTENTICACION ---*/
async function autenticarUsuario(req, res, next) {
    const authorization = req.get("Authorization");

    const coincidencia = authorization?.match(
        /^Bearer\s+(.+)$/i
    );

    if (!coincidencia) {
        return res.status(401).json({
            error:
                "Debes iniciar sesión para acceder a este recurso."
        });
    }

    let payload;

    try {
        payload = jwt.verify(
            coincidencia[1],
            JWT_SECRET,
            {
                algorithms: ["HS256"],
                issuer: "assetto-api",
                audience: "assetto-app"
            }
        );
    } catch {
        return res.status(401).json({
            error:
                "El token no es válido o ha caducado. Inicia sesión de nuevo."
        });
    }

    if (
        typeof payload !== "object" ||
        payload === null
    ) {
        return res.status(401).json({
            error: "El token no es válido."
        });
    }

    const idUsuario = Number(payload.sub);

    if (
        !Number.isSafeInteger(idUsuario) ||
        idUsuario <= 0
    ) {
        return res.status(401).json({
            error: "El token no es válido."
        });
    }

    try {
        const usuario = await db.getUsuarioByID(idUsuario);

        if (!usuario) {
            return res.status(401).json({
                error:
                    "La cuenta no está disponible. Inicia sesión de nuevo."
            });
        }

        req.user = usuario;

        return next();

    } catch (error) {
        return next(error);
    }
}

    // =========================== GET ===========================

/*--- Ruta de la sesion actual ---*/
app.get("/auth/me", autenticarUsuario, (req, res) => {
    return res.status(200).json({
        usuario: req.user
    });
});

/*--- Ruta tan pronto se inicia la API ---*/
app.get("/", (req, res) => {
    return res.status(200).json({
        mensaje: "API de Assetto funcionando correctamente"
    });
});

/*--- CATEGORIAS DEL USUARIO AUTENTICADO ---*/
app.get("/categorias", autenticarUsuario, async (req, res, next) => {
    try {
        const categorias = await db.getCategoriasByUsuarioID(req.user.id_usuario);
        return res.status(200).json(categorias);
    } catch (error) {
        next(error);
    }
});

/*--- CANCIONES DEL USUARIO AUTENTICADO ---*/
app.get("/canciones", autenticarUsuario, async (req, res, next) => {
    try {
        const canciones = await db.getCancionesByUsuarioID(req.user.id_usuario);
        return res.status(200).json(canciones);
    } catch (error) {
        next(error);
    }
});

/*--- LISTAS DEL USUARIO AUTENTICADO ---*/
app.get("/listas", autenticarUsuario, async (req, res, next) => {
    try {
        const listas = await db.getListasByUsuarioID(req.user.id_usuario);
        return res.status(200).json(listas);
    } catch (error) {
        next(error);
    }
});

/*--- obtener canciones de una lista especifica ---*/
app.get('/listas/:id/canciones', autenticarUsuario, async (req, res, next) => {
    const idLista = req.params.id;
    
    try {
        const canciones = await db.getCancionesByListaID(idLista);
        return res.status(200).json(canciones);
    } catch (error) {
        next(error);
    }
});

/*--- CANCIONES EN LA PAPELERA ---*/
app.get("/canciones/papelera", autenticarUsuario, async (req, res, next) => {
    try {
        const canciones = await db.getCancionesEnPapeleraByUsuarioID(req.user.id_usuario);
        return res.status(200).json(canciones);
    } catch (error) {
        next(error);
    }
});

/*--- LISTAS EN LA PAPELERA ---*/
app.get("/listas/papelera", autenticarUsuario, async (req, res, next) => {
    try {
        const listas = await db.getListasEnPapeleraByUsuarioID(req.user.id_usuario);
        return res.status(200).json(listas);
    } catch (error) {
        next(error);
    }
});

    // =========================== POST ===========================

/*--- CREAR NUEVA LISTA ---*/
app.post("/listas", autenticarUsuario, async (req, res, next) => {
    try {
        const { nombre, canciones } = req.body;

        if (!nombre || typeof nombre !== "string" || nombre.trim().length === 0) {
            return res.status(400).json({ error: "El nombre de la lista es obligatorio." });
        }

            // Se crea la lista vacia
        const nuevaLista = await db.createLista(req.user.id_usuario, nombre.trim());

            // Si el usuario selecciono canciones, las agregamos en el orden recibido
        if (Array.isArray(canciones) && canciones.length > 0) {
            for (const cancion of canciones) {
                if (cancion.id_cancion) {
                    await db.addCancionToLista(nuevaLista.id_lista, cancion.id_cancion);
                }
            }
        }

        return res.status(201).json(nuevaLista);
    } catch (error) {
        next(error);
    }
});

/*--- CREAR NUEVA CANCION ---*/
app.post("/canciones", autenticarUsuario, async (req, res, next) => {
    try {
        const { nombre, tempo, tonalidades, categorias, instrumentos } = req.body;

        if (!nombre || typeof nombre !== "string" || nombre.trim().length === 0) {
            return res.status(400).json({ error: "El nombre de la canción es obligatorio." });
        }
        
        if (!Array.isArray(tonalidades) || tonalidades.length === 0) {
            return res.status(400).json({ error: "Debes proporcionar al menos una tonalidad." });
        }

            // Guardar la canciOn base
        const nuevaCancion = await db.createCancion(
            req.user.id_usuario, 
            nombre.trim(), 
            tempo || null, 
            tonalidades
        );

            // Asociar categorias (En caso de que se agregue alguna)
        if (Array.isArray(categorias) && categorias.length > 0) {
            for (const cat of categorias) {
                if (Number.isInteger(cat)) {
                        // Es una categoria que ya existia
                    await db.addCategoriaToCancion(nuevaCancion.id_cancion, cat);
                } else if (typeof cat === "string" && cat.trim() !== "") {
                        // Es una categoria que se esta creando... Primero se crea en la BD.
                    const nuevaCat = await db.createCategoria(req.user.id_usuario, cat.trim());
                    await db.addCategoriaToCancion(nuevaCancion.id_cancion, nuevaCat.id_categoria);
                }
            }
        }

        return res.status(201).json(nuevaCancion);
    } catch (error) {
        next(error);
    }
});

/*--- Ruta no encontrada, el famoso 404 ---*/
app.use((req, res) => {
    return res.status(404).json({
        error: "Ruta no encontrada."
    });
});



/*--- MANEJO DE ERRORES ---*/
app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    if (error.type === "entity.parse.failed") {
        return res.status(400).json({
            error: "El cuerpo de la solicitud no contiene JSON válido."
        });
    }

    if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
            error: "Ya existe un registro con esos datos."
        });
    }

    console.error("Error en la API:", error);

    return res.status(500).json({
        error:
            "Ha ocurrido un error interno en el servidor."
    });
});

/*--- Aqui inicia el servidor ---*/
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(
        `Servidor de Assetto escuchando en el puerto ${PORT}`
    );
});

/*--- Aqui se hace el cierre del servidor y la Base de Datos ---*/
let shuttingDown = false;

async function shutdown(signal) {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;

    console.log(`\n${signal}: cerrando el servidor...`);

    server.close(async (error) => {
        try {
            await db.closeDatabase();

            if (error) {
                console.error(
                    "Error al cerrar el servidor:",
                    error
                );

                process.exitCode = 1;
            } else {
                console.log(
                    "Servidor y conexiones de base de datos cerrados."
                );
            }
        } catch (dbError) {
            console.error(
                "Error al cerrar la base de datos:",
                dbError
            );

            process.exitCode = 1;
        }
    });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));