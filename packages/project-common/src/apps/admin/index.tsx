import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import { registerLegacyPlugins } from "./plugins";
import "./App.scss";

export const App = ({ legacyPlugins, plugins }: any) => {
    registerLegacyPlugins(legacyPlugins);

    return <Admin>{plugins}</Admin>;
};
