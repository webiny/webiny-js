import React, { Fragment } from "react";
import { plugins } from "@webiny/plugins";
import { ViewPlugin } from "../plugins/ViewPlugin";

interface Props {
    name: string;
    props?: Record<string, any>;
    children?: React.ReactNode;
}

export const View = ({ name, children, props = {} }: Props) => {
    const viewPlugins = plugins.byType<ViewPlugin>(ViewPlugin.type).filter(pl => pl.key === name);

    if (viewPlugins.length) {
        children = viewPlugins.reduce((el, pl) => pl.render({ children: el, ...props }), children);
    }

    return <Fragment>{children || null}</Fragment>;
};
