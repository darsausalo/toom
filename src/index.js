import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import dotenv from "dotenv";
import App from "./App";

dotenv.config();

import 'bootstrap/dist/css/bootstrap.min.css';

axios.defaults.baseURL = process.env.REACT_APP_SERVER_BASE_URL;

console.log("env:", process.env.NODE_ENV);
console.log("baseURL:", process.env.REACT_APP_SERVER_BASE_URL);

ReactDOM.render(
    <App/>,
    document.getElementById("root"),
);
