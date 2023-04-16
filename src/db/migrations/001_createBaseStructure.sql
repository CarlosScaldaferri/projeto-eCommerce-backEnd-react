-- Active: 1681299582576@@127.0.0.1@3306
CREATE TABLE IF NOT EXISTS users (
    id TEXT UNIQUE PRIMARY KEY, 
    name TEXT NOT NULl,
    email TEXT NOT NUlL,
    password TEXT NOT NUlL,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchases (
    id TEXT UNIQUE PRIMARY KEY, 
    buyer TEXT NOT NULl,
    total_price REAL NOT NUlL,
    created_at TIMESTAMP,
    paid INTEGER NOT NULL,
    FOREIGN KEY(buyer) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS products (
    id TEXT UNIQUE PRIMARY KEY, 
    name TEXT NOT NULL,
    price REAL NOT NUlL,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS purchases_products (
    purchase_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    PRIMARY KEY (product_id, purchase_id)
);





