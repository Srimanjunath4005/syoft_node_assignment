const express = require('express');
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const cors = require('cors')
const path = require('path')
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')

const app=express();

app.use(express.json());
app.use(cors());

const databasePath=path.join(__dirname,"database.db")

let db=null 

const intializeDbAndServer= async ()=>{
    try{
        db=await open({
            filename:databasePath,
            driver:sqlite3.Database
        });
        app.listen(3000,()=>{
            console.log("server running at 3000")
        })
    }
    catch(e){
        console.log(e)
        process.exit(1)
    }

}

intializeDbAndServer()

const authenticateToken = (request, response, next) => {
    let jwtToken;
    const authHeader = request.headers["authorization"];
    if (authHeader !== undefined) {
      jwtToken = authHeader.split(" ")[1];
    }
    if (jwtToken === undefined) {
      response.status(401);
      response.send("Invalid JWT Token");
    } else {
      jwt.verify(jwtToken, "secret", async (error, payload) => {
        if (error) {
          response.status(401);
          response.send("Invalid JWT Token");
        } else {
          request.username = payload.username;
          request.role = payload.role;
          next();
        }
      });
    }
  };


  const isAdmin = (request, response, next) => {
    if (request.role !== 'admin') {
        return response.status(403).send("Access Denied: Admins only");
    }
    next();
};


const isAdminOrManager = (request, response, next) => {
    if (request.role !== 'admin' && request.role !== 'manager') {
        return response.status(403).send("Access Denied: Admins and Managers only");
    }
    next();
};

app.get('/users', authenticateToken, isAdminOrManager, async (req, res) => {
    try {
      console.log('GET /users route called');
      const getAllUsers = 'SELECT * FROM users;';
      const usersArray = await db.all(getAllUsers);
      res.status(200).send(usersArray);
    } catch (e) {
      console.log(`Error: ${e.message}`);
      res.status(500).send({ error: e.message });
    }
  });


app.get("/users/:userId", authenticateToken, isAdminOrManager, async (req,res)=>{
    const {userId}=req.params 
    const getuser=`
    SELECT * FROM users WHERE userId= ${userId};`;

    const user=await db.get(getuser);
    res.send(user)
})

  app.post("/register", async (req,res)=>{
    const {username,password,role,email}=req.body
    const hashedpassword=await bcrypt.hash(password,10)
    const selectuserquery=`
    SELECT * FROM users WHERE username ='${username}';`;
    const dbuser=await db.get(selectuserquery)
    console.log(dbuser)
    if (dbuser===undefined){
        const adduser=`
        INSERT INTO users(username,password,role,email)
        VALUES('${username}', '${hashedpassword}', '${role}', '${email}');`;
    await db.run(adduser);
    res.send("user created")

    }
    else{
        res.status(400)
        res.send("user Already exits")
    }

})


app.post("/login/",async (req,res)=>{
    const {username,password}=req.body ;
    const selectuserquery=`
    SELECT * FROM users WHERE username ='${username}';`;
    const dbuser=await db.get(selectuserquery)

    if (dbuser===undefined){
        res.status(400);
        res.send("Invalid User")
    }
    else{
        const ispsmatch=await bcrypt.compare(password,dbuser.password);
        if (ispsmatch===true){
            const payload={username:username, role: dbuser.role}
            const jwtToken=jwt.sign(payload,"secret",{ expiresIn: "24h" })
            res.send({jwtToken})
            
        }
    }

})

app.post("/products", authenticateToken, isAdmin, async (req, res) => {
    const { title, description, inventory_count } = req.body;

    try {
        const createProductQuery = `
            INSERT INTO products (title, description, inventory_count)
            VALUES ('${title}', '${description}', '${inventory_count}');`;
        await db.run(createProductQuery, [title, description, inventory_count]);
        res.status(201).send("Product created successfully");
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});


app.get("/products", authenticateToken, isAdminOrManager, async (req, res) => {
    try {
        const getAllProductsQuery = `SELECT * FROM products;`;
        const productsArray = await db.all(getAllProductsQuery);
        res.status(200).send(productsArray);
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

app.get("/products/:productId", authenticateToken, isAdminOrManager, async (req, res) => {
    const { productId } = req.params;

    try {
        const getProductQuery = `SELECT * FROM products WHERE productId = ${productId} ;`;
        const product = await db.get(getProductQuery, [productId]);
        if (product) {
            res.status(200).send(product);
        } else {
            res.status(404).send("Product not found");
        }
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

app.put("/products/:productId", authenticateToken, isAdminOrManager, async (req, res) => {
    const { productId } = req.params;
    const { title, description, inventory_count } = req.body;

    try {
        const updateProductQuery = `
            UPDATE products
            SET title = '${title}', description = '${description}', inventory_count = '${inventory_count}'
            WHERE productId = '${productId}';`;
        const result = await db.run(updateProductQuery, [title, description, inventory_count, productId]);
        if (result.changes === 0) {
            res.status(404).send("Product not found");
        } else {
            res.send("Product updated successfully");
        }
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

app.delete("/products/:productId", authenticateToken, isAdmin, async (req, res) => {
    const { productId } = req.params;

    try {
        const deleteProductQuery = `DELETE FROM products WHERE productId = '${productId}';`;
        const result = await db.run(deleteProductQuery, [productId]);
        if (result.changes === 0) {
            res.status(404).send("Product not found");
        } else {
            res.send("Product deleted successfully");
        }
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});