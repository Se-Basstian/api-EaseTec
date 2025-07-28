import Database from "bun:sqlite";
import swagger from "@elysiajs/swagger";
import { Elysia, t } from "elysia";

const dbFileName = "./src/data/ease_tec.db";
const db = new Database(dbFileName);

const app = new Elysia()
  .use(swagger())

  .get("/producto", () => {
    try {
      const query = db.query("SELECT * FROM productos;");

      const productos = query.all();

      return productos;
    } catch (error) {
      console.error(`Error al obtener al producto: ${error}`);

      return new Response("Error interno del servidor", { status: 500 });
    }
  })

  .post(
    "/producto",
    ({
      body: { nombre, descripcion, precio_venta, stock_actual, id_categoria },
    }) => {
      try {
        const query = db.query(`
        INSERT INTO productos
          (nombre, descripcion, precio_venta, stock_actual, id_categoria)
        VALUES
          ($nombre, $descripcion, $precio_venta, $stock_actual, $id_categoria);
      `);

        query.run({
          $nombre: nombre,
          $descripcion: descripcion ?? "Sin descripción",
          $precio_venta: precio_venta,
          $stock_actual: stock_actual,
          $id_categoria: id_categoria,
        });

        return "Agregado correctamente";
      } catch (error) {
        console.error(`Error al agregar: ${error}`);

        return new Response("Error interno del servidor", { status: 500 });
      }
    },
    {
      body: t.Object({
        nombre: t.String(),
        descripcion: t.Optional(t.String()),
        precio_venta: t.Numeric(),
        stock_actual: t.Integer(),
        id_categoria: t.Integer(),
      }),
    },
  )

  .get(
    "/producto/:id",
    ({ params: { id } }) => {
      try {
        const query = db.query(
          "SELECT nombre FROM productos WHERE id_producto = $id_producto;",
        );

        const producto = query.get({ $id_producto: id });

        return producto;
      } catch (error) {
        console.error(`Error al obtener al producto: ${error}`);

        return new Response("Error interno del servidor", { status: 500 });
      }
    },
    {
      params: t.Object({ id: t.Integer() }),
    },
  )

  .listen(process.env.PORT ?? 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
