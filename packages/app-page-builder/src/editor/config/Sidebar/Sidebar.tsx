import React from "react";
import { makeDecoratable } from "@webiny/app-admin";
import { Element as CoreElement, ElementProps as CoreElementProps } from "../Element";
import { Layout } from "./Layout";
import {
    Elements as BaseElements,
    ElementsProps as BaseElementsProps
} from "~/editor/config/Elements";
import { Tab } from "./Tab";
import { useActiveGroup } from "~/editor/config/Sidebar/useActiveGroup";
import { createGetId } from "~/editor/config/createGetId";
import { CurrentBlockProvider } from "~/editor/contexts/CurrentBlockProvider";

const SCOPE = "sidebar";

const BaseSidebar = () => {
    return (
        <CurrentBlockProvider>
            <Layout />
        </CurrentBlockProvider>
    );
};

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
    useActiveGroup
});
