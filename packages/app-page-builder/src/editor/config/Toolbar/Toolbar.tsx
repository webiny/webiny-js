import React from "react";
import { makeDecoratable } from "@webiny/app-admin";
import { Element as BaseElement, ElementProps as BaseElementProps } from "../Element";
import { Layout } from "./Layout";
import {
    Elements as BaseElements,
    ElementsProps as BaseElementsProps
} from "~/editor/config/Elements";
import { DrawersProvider } from "./Drawers/DrawersProvider";
import { DrawerTrigger } from "./Drawers/DrawerTrigger";
import { Drawer } from "./Drawers/Drawer";
import { IconButton } from "./Drawers/IconButton";
import { createGetId } from "~/editor/config/createGetId";

const SCOPE = "toolbar";

const BaseToolbar = () => {
    return (
        <DrawersProvider>
            <Layout />
        </DrawersProvider>
    );
};

const getElementId = createGetId(SCOPE)();

export type ElementProps = Omit<BaseElementProps, "scope" | "id">;

const BaseToolbarElement = makeDecoratable("ToolbarElement", (props: ElementProps) => {
    return (
        <BaseElement
            {...props}
            scope={SCOPE}
            id={getElementId(props.name)}
            before={props.before ? getElementId(props.before) : undefined}
            after={props.after ? getElementId(props.after) : undefined}
        />
    );
});

export type ElementsProps = Omit<BaseElementsProps, "scope">;

const Elements = makeDecoratable("ToolbarElements", (props: ElementsProps) => {
    return <BaseElements {...props} scope={SCOPE} />;
});

export const Toolbar = Object.assign(BaseToolbar, {
    Layout,
    Element: Object.assign(BaseToolbarElement, { DrawerTrigger, Drawer, IconButton }),
    Elements
});
