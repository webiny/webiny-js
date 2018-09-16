import React from "react";
import ReactDOM from "react-dom";
import { app } from "webiny-app/src";
import App from "./App";

app.setup().then(({ store }) => {
    window.app = app;
    ReactDOM.render(<App store={store} />, document.getElementById("root"));
});
