import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import "./App.scss";

import projectPlugins from "../../../../plugins/admin";

const projectLatestPlugins = projectPlugins()
    // @ts-ignore
    .props.children.filter(component => !component.type.createLegacyPlugin);

export const App = () => {
    return <Admin>{projectLatestPlugins}</Admin>;
};
