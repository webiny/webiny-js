import React from "react";
import { makeDecoratable } from "@webiny/app-admin";
import { Element as BaseElement, ElementProps as BaseElementProps } from "../Element";
import { Elements as BaseElements, ElementsProps as BaseElementsProps } from "../Elements";
import { Divider } from "./Divider";
import { Layout } from "./Layout";

const SCOPE = "topBar";

const BaseTopBar = () => {
    return <Layout />;
};

export type ElementProps = Omit<BaseElementProps, "scope">;

const Element = makeDecoratable("TopBarElement", (props: ElementProps) => {
    return <BaseElement {...props} scope={SCOPE} />;
});

export type ActionProps = Omit<ElementProps, "group">;

const Action = (props: ActionProps) => {
    return <Element {...props} group={"actions"} />;
};

export type ElementsProps = Omit<BaseElementsProps, "scope">;

const Elements = makeDecoratable("TopBarElements", (props: ElementsProps) => {
    return <BaseElements {...props} scope={SCOPE} />;
});


export const TopBar = Object.assign(BaseTopBar, { Element, Elements, Layout, Divider, Action });
