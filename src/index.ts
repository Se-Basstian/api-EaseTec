import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { createClient } from "@supabase/supabase-js";
import { Elysia, status, t } from "elysia";

const supabaseUrl = Bun.env.SUPABASE_URL as string;
const supabaseKey = Bun.env.SUPABASE_KEY as string;

const supabase = createClient(supabaseUrl, supabaseKey);

const app = new Elysia()
  .use(swagger())

  .use(cors())

  .get("/", () => "Api para los productos de Eese-Tec")

  .get("/categoria", async () => {
    const { data: categorias, error } = await supabase
      .from("categorias")
      .select("id_categoria, nombre_categoria, descripcion");

    if (error !== null) {
      console.error(`
        Error al obtener la categoria:
        ${error}
        `);

      return status(500, "Error interno del servidor");
    }

    return categorias;
  })

  .get("/producto", async () => {
    const { data: productos, error } = await supabase
      .from("v_productos")
      .select();

    if (error !== null) {
      console.error(`
        Erro al obtener los productos:
        ${error}
        `);

      return status(500, "Error interno del servidor");
    }

    return productos;
  })

  .post(
    "/producto",
    async ({ body }) => {
      const {
        nuevoNombre,
        nuevoDescripcion,
        nuevoIdCategoria,
        nuevoUrlImg,
        nuevoPrecio,
        nuevoStock,
      } = body;

      const { error } = await supabase.from("productos").insert({
        nombre_producto: nuevoNombre,
        descripcion: nuevoDescripcion ?? null,
        id_categoria: nuevoIdCategoria,
        url_imagen: nuevoUrlImg ?? null,
        precio: nuevoPrecio,
        stock: nuevoStock,
      });

      if (error !== null) {
        console.error("Erro al insertar nuevo producto:", error);

        return status(500, "Error interno del servidor");
      }

      return "Producto creado correctamente";
    },
    {
      body: t.Object({
        nuevoNombre: t.String({ error: "Solo se acepta texto" }),
        nuevoDescripcion: t.Optional(t.String()),
        nuevoUrlImg: t.Optional(t.String()),
        nuevoPrecio: t.Numeric(),
        nuevoStock: t.Integer(),
        nuevoIdCategoria: t.Integer(),
      }),
    },
  )

  .get(
    "/producto/:id",
    async ({ params: { id } }) => {
      const { data: producto, error } = await supabase
        .from("v_productos")
        .select()
        .eq("id", id);

      if (error !== null) {
        console.error(`
          Error al obtener el producto:
          ${error}
          `);

        return status(500, "Error interno del servidor");
      }

      if (producto.length === 0) {
        return status(404, `El producto con el ID ${id} no fue encontrado.`);
      }

      return producto[0];
    },
    {
      params: t.Object({
        id: t.Integer({ minimum: 1, error: "Solo valores mayores a 0" }),
      }),
    },
  )

  .put(
    "/producto/:id",
    async ({ params, body }) => {
      const { id } = params;

      const { nombre, descripcion, urlImagen, idCategoria, precio, stock } =
        body;

      const actualizarProducto: Record<string, string | number> = {};

      if (nombre !== undefined) {
        actualizarProducto.nombre_producto = nombre;
      }
      if (descripcion !== undefined) {
        actualizarProducto.descripcion = descripcion;
      }
      if (urlImagen !== undefined) {
        actualizarProducto.url_imagen = urlImagen;
      }
      if (idCategoria !== undefined) {
        actualizarProducto.id_categoria = idCategoria;
      }
      if (precio !== undefined) {
        actualizarProducto.precio = precio;
      }
      if (stock !== undefined) {
        actualizarProducto.stock = stock;
      }

      if (Object.keys(actualizarProducto).length === 0) {
        return status(400, "No se proporcionó datos para actualizar");
      }

      const { error } = await supabase
        .from("productos")
        .update(actualizarProducto)
        .eq("id_producto", id);

      if (error !== null) {
        console.error("Erro al actualizar producto:", error);

        return status(500, "Error interno del servidor");
      }

      return "Actualizado correctamente";
    },
    {
      params: t.Object({
        id: t.Integer({ error: "Solo número mayores a cero", minimum: 0 }),
      }),
      body: t.Object({
        nombre: t.Optional(t.String()),
        descripcion: t.Optional(t.String()),
        urlImagen: t.Optional(t.String()),
        precio: t.Optional(t.Numeric()),
        stock: t.Optional(t.Integer()),
        idCategoria: t.Optional(t.Integer()),
      }),
    },
  )

  .listen(process.env.PORT ?? 3000);

console.log(
  `🦊 Elysia esta corriendo en el puerto ${app.server?.hostname}:${app.server?.port}`,
);
