import express from "express";
import path from "path";
import session from "express-session";
import mysql from "mysql";

const __dirname = path.resolve();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        secret: "your-secret-key",
        resave: true,
        saveUninitialized: true,
    })
);

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "auth",
    port: "3306",
});

db.connect((err) => {
    if (err) {
        console.error("Error connecting to MySQL:", err);
        return;
    }
    console.log("Connected to MySQL database");
});

const getUserFromDB = (username, password, callback) => {
    const query = `SELECT * FROM users WHERE username = ? AND password = ?`;

    db.query(query, [username, password], (err, results) => {
        if (err) {
            callback(err, null, null);
            return;
        }

        if (results.length > 0) {
            callback(null, results[0], results[0].page);
        } else {
            callback(null, null, null);
        }
    });
};

app.get("/", (req, res) => {
    res.sendFile(path.resolve(__dirname, "static", "loginPage.html"));
});

app.get("/page", (req, res) => {
    if (!req.session.user) {
        res.redirect("/");
        return;
    }

    const username = req.session.user.username;
    res.sendFile(path.resolve(__dirname, "static", `${username}.html`));
});

app.post("/", (req, res) => {
    const { username, password } = req.body;

    getUserFromDB(username, password, (err, user, page) => {
        if (err) {
            console.error("Error querying user from database:", err);
            res.status(500).send("Internal Server Error");
            return;
        }

        if (user) {
            req.session.user = user;
            if (page) {
                res.sendFile(path.resolve(__dirname, "static", `${page}.html`));
            } else {
                res.redirect("/page");
            }
        } else {
            res.sendFile(path.resolve(__dirname, "static", "loginPage.html"));
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`);
});
