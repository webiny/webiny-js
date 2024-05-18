import React from "react";
import "cross-fetch/polyfill";
import "core-js/stable";
import "regenerator-runtime/runtime";

import { App } from "./App";
import "./plugins";

import { renderApp } from "@webiny/app-admin";

renderApp(<App />);
