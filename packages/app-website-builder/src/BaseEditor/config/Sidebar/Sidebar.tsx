import React from "react";
import { makeDecoratable } from "@webiny/app-admin";
import type { ElementProps as CoreElementProps } from "../Element.js";
import { Element as CoreElement } from "../Element.js";
import { Layout } from "./Layout.js";
import type { ElementsProps as BaseElementsProps } from "../Elements.js";
import { Elements as BaseElements } from "../Elements.js";
import { Tab } from "./Tab.js";
import { createGetId } from "../createGetId.js";
import { ScrollableContainer } from "../Sidebar/ScrollableContainer.js";

const SCOPE = "sidebar";

const BaseSidebar = makeDecoratable("SidebarScopedLayout", () => {
    return (
        <div className={"w-[300px] flex-none"}>
            <Layout />
        </div>
    );
});

export type ScopedElementProps = Omit<CoreElementProps, "scope">;

const ScopedElement = makeDecoratable("SidebarScopedElement", (props: ScopedElementProps) => {
    return <CoreElement {...props} scope={SCOPE} />;
});

const getElementId = createGetId(SCOPE)();

export type BaseElementProps = Omit<ScopedElementProps, "id">;

const BaseElement = makeDecoratable("SidebarElement", (props: BaseElementProps) => {
    return (
        <ScopedElement
            {...props}
            id={getElementId(props.name)}
            before={props.before ? getElementId(props.before) : undefined}
            after={props.after ? getElementId(props.after) : undefined}
        />
    );
});

export type ElementsProps = Omit<BaseElementsProps, "scope">;

const Elements = makeDecoratable("SidebarElements", (props: ElementsProps) => {
    return <BaseElements {...props} scope={SCOPE} />;
});

export type GroupProps = Omit<BaseElementProps, "group">;

const BaseGroup = makeDecoratable("SidebarGroup", (props: GroupProps) => {
    return (
        <ScopedElement
            {...props}
            group={"groups"}
            id={getElementId(props.name)}
            before={props.before ? getElementId(props.before) : undefined}
            after={props.after ? getElementId(props.after) : undefined}
        />
    );
});

export const Sidebar = Object.assign(BaseSidebar, {
    Layout,
    Element: BaseElement,
    Elements,
    Group: Object.assign(BaseGroup, { Tab }),
    ScrollableContainer
});
