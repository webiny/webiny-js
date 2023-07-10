import React from "react";
import {Website} from "@webiny/app-website";
import projectPlugins from "../../../../plugins/admin";

const projectLatestPlugins = projectPlugins()
    // @ts-ignore
    .props.children.filter(component => !component.type.createLegacyPlugin);

export const App: React.FC = () => {
    return <Website>{projectLatestPlugins}</Website>;
};
