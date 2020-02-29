import "cross-fetch/polyfill";
import "core-js/stable";
import "regenerator-runtime/runtime";
import React from "react";
import ReactDOM from "react-dom";

const render = module.hot ? ReactDOM.render : ReactDOM.hydrate;

render(<App />, document.getElementById("root"));
