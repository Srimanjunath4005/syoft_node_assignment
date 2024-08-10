-- CREATE TABLE users (
--   userId INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
--   username TEXT NOT NULL UNIQUE,
--   password TEXT NOT NULL,
--   role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'staff')),
--   email TEXT NOT NULL UNIQUE
-- );

-- INSERT INTO users (userId,username,password,role,email)
-- VALUES (1,"Manju","123456","admin","manju@gmail.com")

-- CREATE TABLE products (
--     productId INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
--     title TEXT NOT NULL,
--     description TEXT NOT NULL,
--     inventory_count INTEGER NOT NULL
-- );

-- INSERT INTO products (productId,title,description,inventory_count)
-- VALUES (1,"phone","Realme phone","2")