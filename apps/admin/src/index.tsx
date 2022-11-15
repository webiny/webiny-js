import "cross-fetch/polyfill";
import "core-js/stable";
import "regenerator-runtime/runtime";
import React from "react";
import ReactDOM from "react-dom";
import { AppFolders } from "./App.folders";
import "./plugins";

const render = module.hot ? ReactDOM.render : ReactDOM.hydrate;
render(<AppFolders />, document.getElementById("root"));
