import React from "react";
import ReactDOM from "react-dom";
import { app } from "webiny-app";
import App from "./app";

app.setup().then(() => {
    window.app = app;
    ReactDOM.render(<App />, document.getElementById("root"));
});
