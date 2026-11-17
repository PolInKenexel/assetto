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

if (!JWT_SECRET || Buffer.byteLength(JWT_SECRET, "utf8") < 32) {
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
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"]
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

        const esPasswordValido = usuarioBD
            ? await bcrypt.compare(password, usuarioBD.password_hash)
            : false;

        if (!usuarioBD || !esPasswordValido) {
            return res.status(401).json({
                error: "Correo o contraseña incorrectos."
            });
        }

        // Si la cuenta está eliminada, intentar restaurarla automáticamente.
        if (usuarioBD.fecha_eliminacion) {
            const restaurada = await db.restoreUsuario(
                usuarioBD.id_usuario
            );

            if (!restaurada) {
                return res.status(403).json({
                    error:
                        "El periodo de recuperación de la cuenta ha expirado. No es posible iniciar sesión."
                });
            }
        }

        const usuario = await db.getUsuarioByID(usuarioBD.id_usuario);

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

/*--- recuperar una cuenta eliminada (Podriamos usarla para implementar una pagina directa de restauracion, como alternativa a intentar recuperarla automaticamente al iniciar sesion, como ya hace actualmente) ---*/
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

/*--- ELIMINAR CUENTA ---*/
app.delete("/auth/me", autenticarUsuario, async (req, res, next) => {
    try {
        const eliminada = await db.moveUsuarioToTrash(req.user.id_usuario);

        if (!eliminada) {
            return res.status(409).json({
                error: "No se pudo iniciar el proceso de eliminación de la cuenta."
            });
        }

        return res.status(200).json({
            mensaje: "Tu cuenta ha sido enviada al proceso de eliminación. Puedes recuperarla durante los próximos 14 días."
        });
    } catch (error) {
        next(error);
    }
});

/*--- ACTUALIZAR DATOS DEL USUARIO ---*/
app.patch("/auth/me", autenticarUsuario, async (req, res, next) => {
    try {
        const { nombre, apellido, email } = req.body ?? {};

        const nuevoNombre = nombre ?? req.user.nombre;
        const nuevoApellido = apellido ?? req.user.apellido;
        const nuevoEmail =
            typeof email === "string"
                ? email.trim().toLowerCase()
                : req.user.email;

        if (typeof nuevoNombre !== "string" || nuevoNombre.trim().length === 0 || nuevoNombre.trim().length > 100) {
            return res.status(400).json({
                error: "El nombre no es válido."
            });
        }

        if (typeof nuevoApellido !== "string" || nuevoApellido.trim().length === 0 || nuevoApellido.trim().length > 100) {
            return res.status(400).json({
                error: "El apellido no es válido."
            });
        }

        if (typeof nuevoEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevoEmail) || nuevoEmail.length > 255) {
            return res.status(400).json({
                error: "El correo electrónico no es válido."
            });
        }

        if (nuevoEmail !== req.user.email && await db.emailExists(nuevoEmail)) {
            return res.status(409).json({
                error: "Ese correo electrónico ya está registrado."
            });
        }

        await db.updateUsuario(req.user.id_usuario, nuevoNombre.trim(), nuevoApellido.trim(), nuevoEmail);

        const usuarioActualizado = await db.getUsuarioByID(
            req.user.id_usuario
        );

        return res.status(200).json({
            mensaje: "Datos del usuario actualizados correctamente.",
            usuario: usuarioActualizado
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                error: "Ese correo electrónico ya está registrado."
            });
        }

        next(error);
    }
});

/*--- ACTUALIZAR CONTRASENYA ---*/
app.patch("/auth/me/password", autenticarUsuario, async (req, res, next) => {
    try {
        const { passwordActual, passwordNueva } = req.body ?? {};

        if (typeof passwordActual !== "string" || typeof passwordNueva !== "string") {
            return res.status(400).json({
                error: "Debes proporcionar la contraseña actual y la nueva."
            });
        }

        if (passwordNueva.length < 12 || Buffer.byteLength(passwordNueva, "utf8") > 72) {
            return res.status(400).json({
                error: "La nueva contraseña debe tener al menos 12 caracteres y no superar los 72 bytes."
            });
        }

        const usuarioBD = await db.getUsuarioByEmail(req.user.email);

        const passwordCorrecta = usuarioBD && await bcrypt.compare(passwordActual, usuarioBD.password_hash);

        if (!passwordCorrecta) {
            return res.status(401).json({
                error: "La contraseña actual es incorrecta."
            });
        }

        const nuevoHash = await bcrypt.hash(passwordNueva, 12);
        const actualizado = await db.updatePasswordHash(req.user.id_usuario, nuevoHash);

        if (!actualizado) {
            return res.status(404).json({
                error: "No se pudo actualizar la contraseña."
            });
        }

        return res.status(200).json({
            mensaje: "Contraseña actualizada correctamente."
        });
    } catch (error) {
        next(error);
    }
});

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

    // =========================== FUNCIONES AUXILIARES ===========================

/*--- Se asegura que el id sea un INT valido ---*/
function obtenerIdValido(valor) {
    const id = Number(valor);

    return Number.isSafeInteger(id) && id > 0
        ? id
        : null;
}

/*--- Se asegura que el grupo sea uno de los permitidos por la logica de negocio ---*/
function grupoValido(grupo) {
    return grupo === null ||
        (
            typeof grupo === "string" &&
            /^[A-O]$/.test(grupo)
        );
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

/*--- Obtener canciones de una lista específica ---*/
app.get("/listas/:id/canciones", autenticarUsuario, async (req, res, next) => {
    const idLista = Number(req.params.id);

    if (!Number.isSafeInteger(idLista) || idLista <= 0) {
        return res.status(400).json({
            error: "El identificador de la lista no es válido."
        });
    }

    try {
        const lista = await db.getListaByID(idLista);

        if (!lista || Number(lista.id_usuario) !== req.user.id_usuario) 
        {
            return res.status(404).json({
                error: "La lista no existe o no está disponible."
            });
        }

        const canciones = await db.getCancionesByListaID(idLista);

        return res.status(200).json(canciones);
    } catch (error) {
        next(error);
    }
});

/*--- OBTENER UNA CANCION ESPECIFICA ---*/
app.get("/canciones/:id", autenticarUsuario, async (req, res, next) => {
    const idCancion = Number(req.params.id);

    if (!Number.isSafeInteger(idCancion) || idCancion <= 0) {
        return res.status(400).json({
            error: "El identificador de la canción no es válido."
        });
    }

    try {
        const cancion = await db.getCancionByID(idCancion);

        if (
            !cancion ||
            Number(cancion.id_usuario) !== req.user.id_usuario
        ) {
            return res.status(404).json({
                error: "La canción no existe o no está disponible."
            });
        }

        return res.status(200).json(cancion);
    } catch (error) {
        next(error);
    }
});

/*--- OBTENER CATEGORIAS DE UNA CANCION ---*/
app.get("/canciones/:id/categorias", autenticarUsuario, async (req, res, next) => {
    const idCancion = Number(req.params.id);

    if (!Number.isSafeInteger(idCancion) || idCancion <= 0) {
        return res.status(400).json({
            error: "El identificador de la canción no es válido."
        });
    }

    try {
        const cancion = await db.getCancionByID(idCancion);

        if (
            !cancion ||
            Number(cancion.id_usuario) !== req.user.id_usuario
        ) {
            return res.status(404).json({
                error: "La canción no existe o no está disponible."
            });
        }

        const categorias = await db.getCategoriasByCancionID(idCancion);

        return res.status(200).json(categorias);
    } catch (error) {
        next(error);
    }
});

/*--- OBTENER CANCIONES DE UNA CATEGORIA ---*/
app.get("/categorias/:id/canciones", autenticarUsuario, async (req, res, next) => {
    const idCategoria = Number(req.params.id);

    if (!Number.isSafeInteger(idCategoria) || idCategoria <= 0) {
        return res.status(400).json({
            error: "El identificador de la categoría no es válido."
        });
    }

    try {
        const categoriasUsuario = await db.getCategoriasByUsuarioID(
            req.user.id_usuario
        );

        const categoriaDisponible = categoriasUsuario.some(
            categoria => Number(categoria.id_categoria) === idCategoria
        );

        if (!categoriaDisponible) {
            return res.status(404).json({
                error: "La categoría no existe o no está disponible."
            });
        }

        const canciones = await db.getCancionesByCategoriaID(
            idCategoria,
            req.user.id_usuario
        );

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
        const { nombre, canciones } = req.body ?? {};

        if (typeof nombre !== "string" || nombre.trim().length === 0) {
            return res.status(400).json({
                error: "El nombre de la lista es obligatorio."
            });
        }

        // Validar formato de las canciones
        if (
            canciones !== undefined &&
            (
                !Array.isArray(canciones) ||
                !canciones.every(cancion =>
                    cancion &&
                    obtenerIdValido(cancion.id_cancion) !== null &&
                    (
                        cancion.grupo === undefined ||
                        grupoValido(cancion.grupo)
                    )
                ) ||
                new Set(canciones.map(c => Number(c.id_cancion))).size !== canciones.length
            )
        ) {
            return res.status(400).json({
                error: "Las canciones deben tener IDs válidos, no repetidos y grupos entre A y O o null."
            });
        }

        const nuevaLista = await db.createLista(
            req.user.id_usuario,
            nombre.trim()
        );

        if (!nuevaLista) {
            throw new Error("No se pudo crear la lista.");
        }

        if (canciones?.length > 0) {
            for (const cancion of canciones) {
    // Opcionalmente, podría hacerse que las canciones ya vengan organizadas en grupo desde la creacion de la lista
                await db.addCancionToLista(nuevaLista.id_lista, Number(cancion.id_cancion), req.user.id_usuario, cancion.grupo ?? null);
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
        const {nombre, tempo, tonalidades, categorias} = req.body ?? {};

        if (typeof nombre !== "string" || nombre.trim().length === 0) {
            return res.status(400).json({
                error: "El nombre de la canción es obligatorio."
            });
        }

        if (tempo !== undefined && tempo !== null &&
            (
                typeof tempo !== "number" ||
                !Number.isFinite(tempo) ||
                tempo <= 0
            )
        ) {
            return res.status(400).json({
                error: "El tempo debe ser un número positivo o estar vacío."
            });
        }

        if (!Array.isArray(tonalidades) || tonalidades.length === 0 ||
            !tonalidades.every(
                tonalidad =>
                    typeof tonalidad === "string" &&
                    tonalidad.trim().length > 0
            )
        ) {
            return res.status(400).json({
                error: "Debes proporcionar al menos una tonalidad válida."
            });
        }

        if (categorias !== undefined && !Array.isArray(categorias)) {
            return res.status(400).json({
                error: "Las categorías deben enviarse como una lista."
            });
        }

        const tiposPermitidos = ["genero", "tematica", "instrumento"];

        if (categorias) {
    // Permite buscar una categoria ya sea con su ID, con el nombre de la categoria, o con un objeto que la represente
            for (const categoria of categorias) {
                const esIdValido =
                    Number.isSafeInteger(categoria) &&
                    categoria > 0;

                const esNombreValido =
                    typeof categoria === "string" &&
                    categoria.trim().length > 0;

                const esObjetoValido =
                    categoria !== null &&
                    typeof categoria === "object" &&
                    (
                        (
                            Number.isSafeInteger(categoria.id_categoria) &&
                            categoria.id_categoria > 0
                        ) ||
                        (
                            typeof categoria.nombre === "string" &&
                            categoria.nombre.trim().length > 0 &&
                            tiposPermitidos.includes(
                                categoria.tipo ?? "genero"
                            )
                        )
                    );

                if (!esIdValido && !esNombreValido && !esObjetoValido) {
                    return res.status(400).json({
                        error: "Una o más categorías tienen un formato inválido."
                    });
                }
            }
        }

        const nuevaCancion = await db.createCancion(req.user.id_usuario, nombre.trim(), tempo ?? null, tonalidades.map(tonalidad => tonalidad.trim()));

        if (!nuevaCancion) {
            throw new Error("No se pudo crear la canción.");
        }

    //Intenta ponerle las categorias seleccionadas a la nueva cancion
        if (categorias?.length > 0) {
            for (const categoria of categorias) {
                let idCategoria;

                // Intenta asignarle una categoria existente
                if (typeof categoria === "number") {
                    idCategoria = categoria;
                // Intenta asignarle una categoria que recien se esta creando
                } else if (typeof categoria === "string") {
                    const nuevaCategoria = await db.createCategoria(req.user.id_usuario, categoria.trim(), false, "genero");
                    idCategoria = nuevaCategoria.id_categoria;
                } else if (categoria.id_categoria !== undefined) {
                    idCategoria = categoria.id_categoria;
                } else {
                    const nuevaCategoria = await db.createCategoria(req.user.id_usuario, categoria.nombre.trim(), false, categoria.tipo ?? "genero");
                    idCategoria = nuevaCategoria.id_categoria;
                }

                const asociada = await db.addCategoriaToCancion(nuevaCancion.id_cancion, idCategoria, req.user.id_usuario);

                if (!asociada) {
                    throw new Error(
                        "No se pudo asociar una categoría a la canción."
                    );
                }
            }
        }

        return res.status(201).json(nuevaCancion);
    } catch (error) {
        next(error);
    }
});

/*--- CREAR NUEVA CATEGORIA ---*/
app.post("/categorias", autenticarUsuario, async (req, res, next) => {
    try {
        const { nombre, tipo = "genero" } = req.body ?? {};

        if (
            typeof nombre !== "string" ||
            nombre.trim().length === 0
        ) {
            return res.status(400).json({
                error: "El nombre de la categoría es obligatorio."
            });
        }

        const tiposPermitidos = [
            "genero",
            "tematica",
            "instrumento"
        ];

        if (!tiposPermitidos.includes(tipo)) {
            return res.status(400).json({
                error: "El tipo de categoría no es válido."
            });
        }

        const nuevaCategoria = await db.createCategoria(
            req.user.id_usuario,
            nombre.trim(),
            false,
            tipo
        );

        if (!nuevaCategoria) {
            throw new Error("No se pudo recuperar la categoría creada.");
        }

        return res.status(201).json(nuevaCategoria);
    } catch (error) {
        next(error);
    }
});

/*--- Restauracion de canciones ---*/
app.post("/canciones/:id/restore", autenticarUsuario, async (req, res, next) => {
    try {
        const idCancion = obtenerIdValido(req.params.id);

        if (!idCancion) {
            return res.status(400).json({
                error: "El ID de la canción no es válido."
            });
        }

        const canciones = await db.getCancionesEnPapeleraByUsuarioID(req.user.id_usuario);

        const cancion = canciones.find(
            c => Number(c.id_cancion) === idCancion
        );

        if (!cancion) {
            return res.status(404).json({
                error: "La canción no está en tu papelera."
            });
        }

        const restaurada = await db.restoreCancion(idCancion);

        if (!restaurada) {
            return res.status(409).json({
                error: "La canción ya no puede restaurarse o ha sido restaurada anteriormente."
            });
        }

        return res.status(200).json({
            mensaje: "Canción restaurada correctamente."
        });
    } catch (error) {
        next(error);
    }
});

/*--- Restauracion de listas ---*/
app.post("/listas/:id/restore", autenticarUsuario, async (req, res, next) => {
    try {
        const idLista = obtenerIdValido(req.params.id);

        if (!idLista) {
            return res.status(400).json({
                error: "El ID de la lista no es válido."
            });
        }

        const listas = await db.getListasEnPapeleraByUsuarioID(req.user.id_usuario);

        const lista = listas.find(
            l => Number(l.id_lista) === idLista
        );

        if (!lista) {
            return res.status(404).json({
                error: "La lista no está en tu papelera."
            });
        }

        const restaurada = await db.restoreLista(idLista);

        if (!restaurada) {
            return res.status(409).json({
                error: "La lista ya no puede restaurarse o ha sido restaurada anteriormente."
            });
        }

        return res.status(200).json({
            mensaje: "Lista restaurada correctamente."
        });
    } catch (error) {
        next(error);
    }
});

    // =========================== PATCH ===========================

/*--- ACTUALIZAR CANCION ---*/
app.patch("/canciones/:id", autenticarUsuario, async (req, res, next) => {
    try {
        const idCancion = obtenerIdValido(req.params.id);

        if (!idCancion) {
            return res.status(400).json({
                error: "El ID de la canción no es válido."
            });
        }

        const cancion = await db.getCancionByID(idCancion);

        if (
            !cancion ||
            Number(cancion.id_usuario) !== req.user.id_usuario
        ) {
            return res.status(404).json({
                error: "La canción no existe o no te pertenece."
            });
        }

        const {
            nombre,
            tempo,
            tonalidades
        } = req.body ?? {};

        const nuevoNombre = nombre ?? cancion.nombre;
        const nuevoTempo = tempo === undefined
            ? cancion.tempo
            : tempo;

        const nuevasTonalidades =
            tonalidades ?? (
                typeof cancion.tonalidades === "string"
                    ? JSON.parse(cancion.tonalidades)
                    : cancion.tonalidades
            );

        if (
            typeof nuevoNombre !== "string" ||
            nuevoNombre.trim().length === 0 ||
            nuevoNombre.trim().length > 200
        ) {
            return res.status(400).json({
                error: "El nombre de la canción no es válido."
            });
        }

        if (
            nuevoTempo !== null &&
            (
                typeof nuevoTempo !== "number" ||
                !Number.isSafeInteger(nuevoTempo) ||
                nuevoTempo <= 0 ||
                nuevoTempo > 65535
            )
        ) {
            return res.status(400).json({
                error: "El tempo debe ser un número entero positivo o null."
            });
        }

        if (
            !Array.isArray(nuevasTonalidades) ||
            nuevasTonalidades.length === 0 ||
            nuevasTonalidades.length > 24 ||
            nuevasTonalidades.some(
                t => typeof t !== "string" || t.trim().length === 0
            )
        ) {
            return res.status(400).json({
                error: "Debes proporcionar entre 1 y 24 tonalidades válidas."
            });
        }

        const actualizado = await db.updateCancion(
            idCancion,
            nuevoNombre.trim(),
            nuevoTempo === null ? null : Number(nuevoTempo),
            nuevasTonalidades.map(t => t.trim())
        );

        if (!actualizado) {
            // Puede ocurrir si los datos enviados son idénticos.
            const cancionActualizada = await db.getCancionByID(idCancion);

            if (!cancionActualizada) {
                return res.status(404).json({
                    error: "La canción ya no está disponible."
                });
            }
        }

        return res.status(200).json({
            mensaje: "Canción actualizada correctamente."
        });

    } catch (error) {
        next(error);
    }
});

/*--- ACTUALIZAR CATEGORIA DEL USUARIO ---*/
app.patch("/categorias/:id", autenticarUsuario, async (req, res, next) => {
    try {
        const idCategoria = obtenerIdValido(req.params.id);

        if (!idCategoria) {
            return res.status(400).json({
                error: "El ID de la categoría no es válido."
            });
        }

        const categorias = await db.getCategoriasByUsuarioID(
            req.user.id_usuario
        );

        const categoria = categorias.find(
            c => Number(c.id_categoria) === idCategoria
        );

        if (
            !categoria ||
            categoria.publico === true ||
            Number(categoria.publico) === 1
        ) {
            return res.status(404).json({
                error: "La categoría no existe, no te pertenece o es global."
            });
        }

        const { nombre, tipo } = req.body ?? {};

        const nuevoNombre = nombre ?? categoria.nombre;
        const nuevoTipo = tipo ?? categoria.tipo;

        const tiposPermitidos = [
            "genero",
            "tematica",
            "instrumento"
        ];

        if (
            typeof nuevoNombre !== "string" ||
            nuevoNombre.trim().length === 0 ||
            nuevoNombre.trim().length > 100
        ) {
            return res.status(400).json({
                error: "El nombre de la categoría no es válido."
            });
        }

        if (!tiposPermitidos.includes(nuevoTipo)) {
            return res.status(400).json({
                error: "El tipo debe ser genero, tematica o instrumento."
            });
        }

        await db.updateCategoria(
            idCategoria,
            req.user.id_usuario,
            nuevoNombre.trim(),
            nuevoTipo
        );

        return res.status(200).json({
            mensaje: "Categoría actualizada correctamente."
        });

    } catch (error) {
        next(error);
    }
});

/*--- Se actualiza solo el nombre de la lista ---*/
app.patch("/listas/:id", autenticarUsuario, async (req, res, next) => {
    try {
        const idLista = obtenerIdValido(req.params.id);

        if (!idLista) {
            return res.status(400).json({
                error: "El ID de la lista no es válido."
            });
        }

        const lista = await db.getListaByID(idLista);

        if (!lista || Number(lista.id_usuario) !== req.user.id_usuario) {
            return res.status(404).json({
                error: "La lista no existe o no te pertenece."
            });
        }

        const { nombre } = req.body ?? {};

        if (typeof nombre !== "string" || nombre.trim().length === 0 || nombre.trim().length > 150) {
            return res.status(400).json({
                error: "El nombre de la lista no es válido."
            });
        }

        await db.updateNombreLista(idLista, nombre.trim());

        return res.status(200).json({
            mensaje: "Lista actualizada correctamente."
        })
    } catch (error) {
        next(error);
    }
});

/*--- Se reordenan las canciones de la lista ---*/
app.patch("/listas/:id/orden", autenticarUsuario, async (req, res, next) => {
    try {
        const idLista = obtenerIdValido(req.params.id);

        if (!idLista) {
            return res.status(400).json({
                error: "El ID de la lista no es válido."
            });
        }

        const lista = await db.getListaByID(idLista);

        if (!lista || Number(lista.id_usuario) !== req.user.id_usuario) {
            return res.status(404).json({
                error: "La lista no existe o no te pertenece."
            });
        }

        const { canciones } = req.body ?? {};

        if (!Array.isArray(canciones) || canciones.some(id => !Number.isSafeInteger(id) || id <= 0) || new Set(canciones).size !== canciones.length) {
            return res.status(400).json({
                error: "Debes enviar un arreglo de IDs válidos y sin repetidos."
            });
        }

        await db.reorderCancionesEnLista(idLista, canciones);

        return res.status(200).json({
            mensaje: "Orden de canciones actualizado correctamente."
        });
    } catch (error) {
        if (error instanceof TypeError || error.message?.includes("orden")) {
            return res.status(400).json({
                error: error.message
            });
        }

        next(error);
    }
});

/*--- Se le asigna un nuevo grupo a una cancion en unas lista ---*/
app.patch("/listas/:id/canciones/:idCancion/grupo", autenticarUsuario, async (req, res, next) => {
    try {
        const idLista = obtenerIdValido(req.params.id);
        const idCancion = obtenerIdValido(req.params.idCancion);
        const { grupo } = req.body ?? {};

        if (!idLista || !idCancion) {
            return res.status(400).json({
                error: "El ID de la lista o de la canción no es válido."
            });
        }

        if (!Object.hasOwn(req.body ?? {}, "grupo") || !grupoValido(grupo)) {
            return res.status(400).json({
                error: "El grupo debe ser una letra de la A a la O o null."
            });
        }

        const lista = await db.getListaByID(idLista);

        if (!lista || Number(lista.id_usuario) !== req.user.id_usuario) {
            return res.status(404).json({
                error: "La lista no existe o no te pertenece."
            });
        }

        const canciones = await db.getCancionesByListaID(idLista);

        const pertenece = canciones.some(
            c => Number(c.id_cancion) === idCancion
        );

        if (!pertenece) {
            return res.status(404).json({
                error: "La canción no pertenece a esta lista o no está activa."
            });
        }

        await db.updateGrupoCancionEnLista(idLista, idCancion, grupo);

        return res.status(200).json({
            mensaje: "Grupo actualizado correctamente."
        });

    } catch (error) {
        next(error);
    }
});

/*--- ACTUALIZAR CATEGORIAS DE UNA CANCION ---*/
app.patch("/canciones/:id/categorias/:idCategoria", autenticarUsuario, async (req, res, next) => {
    try {
        const idCancion = obtenerIdValido(req.params.id);
        const idCategoria = obtenerIdValido(req.params.idCategoria);
        const { asignada } = req.body ?? {};

        if (!idCancion || !idCategoria) {
            return res.status(400).json({
                error: "El ID de la canción o categoría no es válido."
            });
        }

        if (typeof asignada !== "boolean") {
            return res.status(400).json({
                error: "Debes indicar asignada como true o false."
            });
        }

        const cancion = await db.getCancionByID(idCancion);

        if (!cancion || Number(cancion.id_usuario) !== req.user.id_usuario) {
            return res.status(404).json({
                error: "La canción no existe o no te pertenece."
            });
        }

        const categorias = await db.getCategoriasByUsuarioID(req.user.id_usuario);

        const categoriaDisponible = categorias.some(
            c => Number(c.id_categoria) === idCategoria
        );

        if (!categoriaDisponible) {
            return res.status(404).json({
                error: "La categoría no existe o no está disponible."
            });
        }

        if (asignada) {
            const resultado = await db.addCategoriaToCancion(idCancion, idCategoria, req.user.id_usuario);

            if (!resultado) {
                return res.status(409).json({
                    error: "La categoría ya está asignada a esta canción."
                });
            }

            return res.status(200).json({
                mensaje: "Categoría asignada correctamente."
            });
        }

        const resultado = await db.removeCategoriaFromCancion(
            idCancion,
            idCategoria,
            req.user.id_usuario
        );

        if (!resultado) {
            return res.status(404).json({
                error: "La categoría no estaba asignada a esta canción."
            });
        }

        return res.status(200).json({
            mensaje: "Categoría retirada correctamente."
        });

    } catch (error) {
        next(error);
    }
});

/*--- ACTUALIZAR CANCIONES DE UNA LISTA ---*/
app.patch("/listas/:id/canciones/:idCancion", autenticarUsuario, async (req, res, next) => {
    try {
        const idLista = obtenerIdValido(req.params.id);
        const idCancion = obtenerIdValido(req.params.idCancion);

        const { incluida, grupo } = req.body ?? {};

        if (!idLista || !idCancion) {
            return res.status(400).json({
                error: "El ID de la lista o canción no es válido."
            });
        }

        if (typeof incluida !== "boolean") {
            return res.status(400).json({
                error: "Debes indicar incluida como true o false."
            });
        }

        if (incluida && Object.hasOwn(req.body ?? {}, "grupo") && !grupoValido(grupo)) {
            return res.status(400).json({
                error: "El grupo debe ser una letra de la A a la O o null."
            });
        }

        const lista = await db.getListaByID(idLista);

        if (!lista || Number(lista.id_usuario) !== req.user.id_usuario) {
            return res.status(404).json({
                error: "La lista no existe o no te pertenece."
            });
        }

        const cancion = await db.getCancionByID(idCancion);

        if (!cancion || Number(cancion.id_usuario) !== req.user.id_usuario) {
            return res.status(404).json({
                error: "La canción no existe o no te pertenece."
            });
        }

        const cancionesLista = await db.getCancionesByListaID(idLista);

        const yaIncluida = cancionesLista.some(
            c => Number(c.id_cancion) === idCancion
        );

        if (incluida) {
            if (yaIncluida) {
                return res.status(409).json({
                    error: "La canción ya pertenece a esta lista."
                });
            }

            await db.addCancionToLista(idLista, idCancion, req.user.id_usuario, grupo ?? null);

            return res.status(200).json({
                mensaje: "Canción agregada a la lista correctamente."
            });
        }

        if (!yaIncluida) {
            return res.status(404).json({
                error: "La canción no pertenece a esta lista."
            });
        }

        const resultado = await db.removeCancionFromLista(idLista, idCancion, req.user.id_usuario);

        if (!resultado) {
            return res.status(404).json({
                error: "No se pudo retirar la canción de la lista."
            });
        }

        return res.status(200).json({
            mensaje: "Canción retirada de la lista correctamente."
        });

    } catch (error) {
        next(error);
    }
});

    // =========================== DELETE ===========================

/*--- Enviar una cancion a la papelera ---*/
app.delete("/canciones/:id", autenticarUsuario, async (req, res, next) => {
    try {
        const idCancion = obtenerIdValido(req.params.id);

        if (!idCancion) {
            return res.status(400).json({
                error: "El ID de la canción no es válido."
            });
        }

        const cancion = await db.getCancionByID(idCancion);

        if (
            !cancion ||
            Number(cancion.id_usuario) !== req.user.id_usuario
        ) {
            return res.status(404).json({
                error: "La canción no existe o no te pertenece."
            });
        }

        const eliminada = await db.moveCancionToTrash(idCancion);

        if (!eliminada) {
            return res.status(409).json({
                error: "No se pudo enviar la canción a la papelera."
            });
        }

        return res.status(200).json({
            mensaje: "Canción enviada a la papelera. Puedes restaurarla durante los próximos 30 días."
        });

    } catch (error) {
        next(error);
    }
});

/*--- Enviar una lista a una papelera ---*/
app.delete("/listas/:id", autenticarUsuario, async (req, res, next) => {
    try {
        const idLista = obtenerIdValido(req.params.id);

        if (!idLista) {
            return res.status(400).json({
                error: "El ID de la lista no es válido."
            });
        }

        const lista = await db.getListaByID(idLista);

        if (!lista || Number(lista.id_usuario) !== req.user.id_usuario) {
            return res.status(404).json({
                error: "La lista no existe o no te pertenece."
            });
        }

        const eliminada = await db.moveListaToTrash(idLista);

        if (!eliminada) {
            return res.status(409).json({
                error: "No se pudo enviar la lista a la papelera."
            });
        }

        return res.status(200).json({
            mensaje: "Lista enviada a la papelera. Puedes restaurarla durante los próximos 30 días."
        });
    } catch (error) {
        next(error);
    }
});

/*--- ELIMINACION DE CATEGORIAS DE USUARIOS ---*/
app.delete("/categorias/:id", autenticarUsuario, async (req, res, next) => {
    try {
        const idCategoria = obtenerIdValido(req.params.id);

        if (!idCategoria) {
            return res.status(400).json({
                error: "El ID de la categoría no es válido."
            });
        }

        const categorias = await db.getCategoriasByUsuarioID(req.user.id_usuario);

        const categoria = categorias.find(
            c => Number(c.id_categoria) === idCategoria
        );

        if (!categoria) {
            return res.status(404).json({
                error: "La categoría no existe o no está disponible."
            });
        }

        if (categoria.publico === true || Number(categoria.publico) === 1) {
            return res.status(403).json({
                error: "No puedes eliminar una categoría global."
            });
        }

        const eliminada = await db.deleteCategoria(idCategoria);

        if (!eliminada) {
            return res.status(409).json({
                error: "No se pudo eliminar la categoría."
            });
        }

        return res.status(200).json({
            mensaje: "Categoría eliminada definitivamente."
        });
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