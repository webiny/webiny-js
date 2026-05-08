import React from "react";
import "cross-fetch/polyfill";
import "core-js/stable";
import "regenerator-runtime/runtime";
import { renderApp } from "@webiny/app";
import { App } from "./App.js";

renderApp(<App />);
