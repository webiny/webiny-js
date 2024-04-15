import "cross-fetch/polyfill";
import "core-js/stable";
import "regenerator-runtime/runtime";
import React from "react";
import ReactDOM from "react-dom";
import { App } from "./App";
import "./plugins";
import "theme/global.scss";
import "@aws-amplify/ui-react/styles.css";

const render = module.hot ? ReactDOM.render : ReactDOM.hydrate;
render(<App />, document.getElementById("root"));
