import React from "react";
import { Website } from "@webiny/app-website";
import { registerLegacyPlugins } from "./plugins";
import "./App.scss";

export const App = ({ legacyPlugins, plugins }: any) => {
    registerLegacyPlugins(legacyPlugins);

    return <Website>{plugins}</Website>;
};
