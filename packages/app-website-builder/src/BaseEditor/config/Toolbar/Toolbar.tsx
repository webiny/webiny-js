import React from "react";
import { makeDecoratable } from "@webiny/app-admin";
import type { ElementProps as BaseElementProps } from "../Element.js";
import { Element as BaseElement } from "../Element.js";
import { Layout } from "./Layout.js";
import type { ElementsProps as BaseElementsProps } from "../Elements.js";
import { Elements as BaseElements } from "../Elements.js";
import { createGetId } from "../createGetId.js";

const SCOPE = "toolbar";

const BaseToolbar = makeDecoratable("ToolbarLayout", () => {
    return (
        <div className={"w-[300px] flex-none"}>
            <Layout />
        </div>
    );
});

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
    Element: BaseToolbarElement,
    Elements
});
