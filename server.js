const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);

app.use(express.json());

app.get("/", (req, res) => {
    res.json({text: "Hello, World"});
});

server.listen(3001, () => {
    console.log("listening on *:3001");
});
