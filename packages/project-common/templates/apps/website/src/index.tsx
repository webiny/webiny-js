import "cross-fetch/polyfill";
import "core-js/stable";
import "regenerator-runtime/runtime";
import React from "react";
import ReactDOM from "react-dom";
import { App } from "@webiny/project-common/apps/website";

import plugins from "./plugins";
import legacyPlugins from "./legacyPlugins";

const render = module.hot ? ReactDOM.render : ReactDOM.hydrate;
render(<App plugins={plugins} legacyPlugins={legacyPlugins} />, document.getElementById("root"));
