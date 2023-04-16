import express, { Request, Response } from "express";
import cors from "cors";
import { db } from "./db/db-config";
import Joi, { ValidationError } from "joi";
import { log } from "console";

const app = express();
app.use(express.json());
app.use(cors());

app.listen(3003, () => {
  console.log("Servidor rodando na porta 3003");
});

app.get("/ping", async (req: Request, res: Response) => {
  try {
    res.status(200).send({ message: "Pong!" });
  } catch (error) {
    console.log(error);

    if (req.statusCode === 200) {
      res.status(500);
    }

    if (error instanceof Error) {
      res.send(error.message);
    } else {
      res.send("Erro inesperado");
    }
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await db.select("*").from("users");
    res.status(200).send(users);
  } catch (error: any) {
    console.error(error);
    res
      .status(res.statusCode === 200 ? 500 : res.statusCode)
      .send(error.message);
  }
});

app.post("/users", async (req, res) => {
  try {
    const { error } = Joi.object({
      id: Joi.string().required(),
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    }).validate(req.body);

    if (error) {
      res.status(400);
      throw new Error(`Dados inválidos. ${error.message}`);
    }

    const { id, name, email, password } = req.body;
    const created_at = db.fn.now();

    const existingUser = await db("users").where({ id }).first();
    if (existingUser) {
      return res.status(409).send("Usuário já existe");
    }

    await db("users").insert({ id, name, email, password, created_at });

    res.status(201).send("Usuário criado com sucesso");
  } catch (error: any) {
    console.log(error);

    if (res.statusCode === 200) {
      res.status(500);
      res.send("Erro inesperado.");
    }

    res.send(error.message);
  }
});

app.get("/products", async (req, res) => {
  try {
    const products = await db.select("*").from("products");
    res.status(200).send(products);
  } catch (error: any) {
    console.error(error);
    res
      .status(res.statusCode === 200 ? 500 : res.statusCode)
      .send(error.message);
  }
});

app.get("/products/search", async (req, res) => {
  try {
    const { error } = Joi.object({
      q: Joi.string().min(1).required(),
    }).validate(req.query);
    if (error) {
      res.status(400);
      throw new Error(error.message);
    }

    const q = req.query.q as string;

    const products = await db
      .select("*")
      .from("products")
      .where("name", "like", `%${q}%`);
    res.status(200).send(products);
  } catch (error: any) {
    console.error(error);
    res
      .status(res.statusCode === 200 ? 500 : res.statusCode)
      .send(error.message);
  }
});

app.post("/products", async (req, res) => {
  try {
    const { error } = Joi.object({
      id: Joi.string().required(),
      name: Joi.string().required(),
      price: Joi.number().required(),
      description: Joi.string().required(),
      image_url: Joi.string().required(),
    }).validate(req.body);

    if (error) {
      res.status(400);
      throw new Error(`Dados inválidos. ${error.message}`);
    }

    const { id, name, price, description, image_url } = req.body;
    const created_at = db.fn.now();

    const existingProduct = await db("products").where({ id }).first();
    if (existingProduct) {
      return res.status(409).send("Produto já existe");
    }

    await db("products").insert({ id, name, price, description, image_url });

    res.status(201).send("Produto criado com sucesso");
  } catch (error: any) {
    console.log(error);

    if (res.statusCode === 200) {
      res.status(500);
      res.send("Erro inesperado.");
    }

    res.send(error.message);
  }
});

app.put("/products/:id", async (req, res) => {
  try {
    const { error } = Joi.object({
      name: Joi.string(),
      price: Joi.number(),
      description: Joi.string(),
      image_url: Joi.string(),
    }).validate(req.body);

    if (error) {
      res.status(400);
      throw new Error(`Dados inválidos. ${error.message}`);
    }

    const id = req.params.id;
    const product = await db("products").where({ id }).first();
    if (!product) {
      return res.status(409).send("Produto não existe");
    }

    const { name, price, description, image_url } = req.body;
    const updateProduct = {
      name: name || product.name,
      price: price || product.price,
      description: description || product.description,
      image_url: image_url || product.image_url,
    };
    await db("products").update(updateProduct).where({ id: id });

    res.status(201).send("Produto alterado com sucesso");
  } catch (error: any) {
    console.log(error);

    if (res.statusCode === 200) {
      res.status(500);
      res.send("Erro inesperado.");
    }

    res.send(error.message);
  }
});

app.post("/purchases", async (req, res) => {
  try {
    const { error } = Joi.object({
      id: Joi.string().required(),
      buyer: Joi.string().required(),
      products: Joi.array()
        .items(
          Joi.object({
            id: Joi.string().required(),
            quantity: Joi.number().integer().positive().required(),
          })
        )
        .required(),
      total_price: Joi.number().required(),
      paid: Joi.number().required(),
    }).validate(req.body);

    if (error) {
      res.status(400);
      throw new Error(`Dados inválidos. ${error.message}`);
    }

    const { id, buyer, total_price, paid, products } = req.body;
    const created_at = db.fn.now();

    const user = await db("users").where({ id: buyer });
    console.log(user[0]);

    if (!user[0]) {
      res.status(404);
      throw new Error("Usuário não foi encontrado.");
    }

    const productIds = products.map((product: any) => product.id);
    const productsExist = await db("products").whereIn("id", productIds);
    if (productsExist.length !== products.length) {
      res.status(400);
      throw new Error("Alguns dos produtos não foram encontrados.");
    }

    await db("purchases").insert({ id, buyer, total_price, created_at, paid });

    for (let product of products) {
      const productId = product.id;
      const productQuantity = product.quantity;
      await db("purchases_products").insert({
        purchase_id: id,
        product_id: productId,
        quantity: productQuantity,
      });
    }

    res.status(201).send("Pedido realizado com sucesso");
  } catch (error: any) {
    console.log(error);

    if (res.statusCode === 200) {
      res.status(500);
      res.send("Erro inesperado.");
    }

    res.send(error.message);
  }
});

app.delete("/purchases/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const purchase = await db("purchases").where({ id: id });

    if (purchase.length === 0) {
      res.status(400);
      throw new Error("Id não encontrado");
    }

    await db("purchases_products").del().where({ purchase_id: id });

    await db("purchases").del().where({ id: id });

    res.status(200).send({ message: "Pedido apagado" });
  } catch (error) {
    console.log(error);

    if (res.statusCode === 200) {
      res.status(500);
    }
    if (error instanceof Error) {
      res.send(error.message);
    } else {
      res.send("Erro inesperado.");
    }
  }
});

app.get("/purchases/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const serachPurchase = await db("purchases").where({ id: id });

    if (serachPurchase.length === 0) {
      res.status(400);
      throw new Error("Não existe compra com esse id.");
    }

    const purchase = await db("purchases")
      .select(
        "purchases.id",
        "purchases.total_price",
        "purchases.buyer",
        "users.name",
        "users.email"
      )
      .innerJoin("users", "purchases.buyer", "=", "users.id")
      .where({ "purchases.id": id })
      .groupBy("purchases.id");

    const productList = await db("purchases_products")
      .select(
        "purchases_products.product_id AS id",
        "products.name",
        "products.price",
        "products.description",
        "products.image_Url",
        "purchases_products.quantity"
      )
      .innerJoin(
        "products",
        "purchases_products.product_id",
        "=",
        "products.id"
      )
      .where({ "purchases_products.purchase_id": id });

    console.log(purchase);
    console.log(productList);

    const result = { purchase, productList };

    res.status(200).send(result);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).send(error.message);
    } else {
      res.status(500).send("Erro inesperado");
    }
  }
});
