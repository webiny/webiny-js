import React from "react";
import ReactDOM from "react-dom";
import config from "./config/index";
import App from "./App";

ReactDOM.render(<App config={config} />, document.getElementById("root"));
