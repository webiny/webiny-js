import React from "react";
{GLOBAL_CSS}

import "cross-fetch/polyfill";
import "core-js/stable";
import "regenerator-runtime/runtime";
import { App } from "./App";

import { renderApp } from "@webiny/app";

renderApp(<App />);
