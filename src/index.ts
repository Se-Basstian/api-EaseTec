import Database from "bun:sqlite";
import swagger from "@elysiajs/swagger";
import { Elysia, status, t } from "elysia";

const rutaDeBaseDeDatos = "./src/data/ease_tec.db";
const db = new Database(rutaDeBaseDeDatos);

const app = new Elysia()
  .use(swagger())

  .get("/", () => "Api para los productos de Eese-Tec")

  .get("/categoria", () => {
    try {
      const solicitudDeCategorias = db.query("SELECT * FROM categorias;");

      const categorias = solicitudDeCategorias.all();

      return categorias;
    } catch (error) {
      console.error(`Error al obtener las categoría: ${error}`);

      return status(500, "Error interno del servidor");
    }
  })

  .get("/producto", () => {
    try {
      const solicitudDeProductos = db.query(`
        SELECT
          id_producto,
          nombre_producto,
          url_imagen,
          precio,
          stock,
          nombre_categoria
        FROM
          productos AS A
            JOIN
          categorias AS B
            ON A.id_categoria = B.id_categoria;
        `);

      const productos = solicitudDeProductos.all();

      return productos;
    } catch (error) {
      console.error(`Error al obtener al producto: ${error}`);

      return status(500, "Error interno del servidor");
    }
  })

  .post(
    "/producto",
    ({
      body: {
        nuevo_nombre,
        nuevo_precio_venta,
        nuevo_stock_actual,
        nuevo_id_categoria,
      },
    }) => {
      try {
        const solicitudDeNuevoProducto = db.query(`
        INSERT INTO productos
          (nombre_producto, precio, stock, id_categoria)
        VALUES
          ($nombre_producto, $precio, $stock, $id_categoria);
      `);

        solicitudDeNuevoProducto.run({
          $nombre_producto: nuevo_nombre,
          $precio: nuevo_precio_venta,
          $stock: nuevo_stock_actual,
          $id_categoria: nuevo_id_categoria,
        });

        return "Agregado correctamente";
      } catch (error) {
        console.error(`Error al agregar: ${error}`);

        return status(500, "Error interno del servidor");
      }
    },
    {
      body: t.Object({
        nuevo_nombre: t.String(),
        nuevo_precio_venta: t.Numeric(),
        nuevo_stock_actual: t.Integer(),
        nuevo_id_categoria: t.Integer(),
      }),
    },
  )

  .get(
    "/producto/:id",
    ({ params: { id } }) => {
      try {
        const solicitudDeProductoPorId = db.query(`
          SELECT
           id_producto ,nombre_producto, url_imagen, precio, stock, nombre_categoria
          FROM
            productos AS A
              JOIN
            categorias AS B
              ON A.id_categoria = B.id_categoria
          WHERE
            A.id_producto = ?;
        `);

        const producto = solicitudDeProductoPorId.get(id);

        return producto;
      } catch (error) {
        console.error(`Error al obtener al producto: ${error}`);

        return status(500, "Error interno del servidor");
      }
    },
    {
      params: t.Object({ id: t.Integer() }),
    },
  )

  .put(
    "/producto/:id",
    ({
      params: { id },
      body: {
        id_categoria,
        nombre_producto,
        precio_venta,
        stock_actual,
        url_imagen,
      },
    }) => {
      try {
        const productoParaActualizar = db
          .query(
            "SELECT id_producto, id_categoria FROM productos WHERE id_producto = ?;",
          )
          .get(id) as { id_producto: number; id_categoria: number };

        if (productoParaActualizar.id_producto >= 25) {
          return "Llegaste al límite. Solicita más recurso a tu Programador";
        }

        if (!productoParaActualizar) {
          return status(404, "Producto no encontrado");
        }

        if (id_categoria !== undefined) {
          const categoriaParaActualizar = db
            .query(
              "SELECT id_categoria FROM categorias WHERE id_categoria = ?;",
            )
            .get(id_categoria);

          if (!categoriaParaActualizar) {
            return status(400, "Categoría no encontrada");
          }
        }

        const camposParaActualizar: string[] = [];
        const valorParaAgregar: (number | string)[] = [];

        if (nombre_producto !== undefined) {
          camposParaActualizar.push("nombre_producto = $nombre");
          valorParaAgregar.push(nombre_producto);
        }
        if (url_imagen !== undefined) {
          camposParaActualizar.push("url_imagen = $url_imagen");
          valorParaAgregar.push(url_imagen);
        }
        if (precio_venta !== undefined) {
          camposParaActualizar.push("precio = $precio");
          valorParaAgregar.push(precio_venta);
        }
        if (stock_actual !== undefined) {
          camposParaActualizar.push("stock = $stock");
          valorParaAgregar.push(stock_actual);
        }
        if (id_categoria !== undefined) {
          camposParaActualizar.push("id_categoria = $id_categoria");
          valorParaAgregar.push(id_categoria);
        }

        if (camposParaActualizar.length === 0) {
          return status(400, "No hay datos para actualizar");
        }

        valorParaAgregar.push(id);

        const putQuery = db.query(`
          UPDATE producto_productos
          SET ${camposParaActualizar.join(", ")}
          WHERE id_producto = ?;
        `);

        putQuery.run(...valorParaAgregar);

        return "Actualizado con éxito";
      } catch (error) {
        console.error(`Error al actualizar producto: ${error}`);

        return status(505, "Error del servidor");
      }
    },
    {
      params: t.Object({ id: t.Integer() }),
      body: t.Object({
        nombre_producto: t.Optional(t.String()),
        descripcion: t.Optional(t.String()),
        url_imagen: t.Optional(t.String()),
        precio_venta: t.Optional(t.Numeric()),
        stock_actual: t.Optional(t.Integer()),
        id_categoria: t.Optional(t.Integer()),
      }),
    },
  )

  .listen(process.env.PORT ?? 3000);

console.log(
  `🦊 Elysia esta corriendo en el puerto ${app.server?.hostname}:${app.server?.port}`,
);
