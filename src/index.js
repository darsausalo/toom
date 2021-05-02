import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import App from "./App";

import 'bootstrap/dist/css/bootstrap.min.css';

axios.defaults.baseURL = "http://localhost:3001";

ReactDOM.render(
    <App/>,
    document.getElementById("root"),
);
