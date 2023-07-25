import "cross-fetch/polyfill";
import "core-js/stable";
import "regenerator-runtime/runtime";
import React from "react";
import ReactDOM from "react-dom";
import { App } from "@webiny/project-common/apps/admin";
import "./App.scss";

import projectPlugins from "../../../../plugins/admin";

const projectLegacyPlugins = projectPlugins()
    // @ts-ignore
    .props.children.filter(component => typeof component.type.createLegacyPlugin === "function")
    // @ts-ignore
    .map(component => component.type.createLegacyPlugin(component.props));

const projectLatestPlugins = projectPlugins()
    // @ts-ignore
    .props.children.filter(component => !component.type.createLegacyPlugin);

const render = module.hot ? ReactDOM.render : ReactDOM.hydrate;
render(
    <App plugins={projectLatestPlugins} legacyPlugins={projectLegacyPlugins} />,
    document.getElementById("root")
);
