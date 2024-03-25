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
import { IconButton } from "./IconButton";
import { createGetId } from "~/editor/config/createGetId";

const SCOPE = "sidebar";

const BaseSidebar = () => {
    return <Layout />;
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

export type ElementPropertyProps = Omit<BaseElementProps, "scope">;

const getElementPropertyId = createGetId(SCOPE)("elementProperty");

const BaseElementProperty = makeDecoratable(
    "SidebarElementProperty",
    (props: ElementPropertyProps) => {
        return (
            <ScopedElement
                {...props}
                id={getElementPropertyId(props.name)}
                before={props.before ? getElementPropertyId(props.before) : undefined}
                after={props.after ? getElementPropertyId(props.after) : undefined}
            />
        );
    }
);

const ElementPropertyGroups = {
    STYLE_GROUP: "styleProperties",
    ELEMENT_GROUP: "elementProperties"
};

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

const getElementActionId = createGetId(SCOPE)("elementAction");

export type ElementActionProps = Omit<BaseElementProps, "group">;

const BaseElementAction = makeDecoratable("SidebarElementAction", (props: ElementActionProps) => {
    return (
        <ScopedElement
            {...props}
            group={"actions"}
            id={getElementActionId(props.name)}
            before={props.before ? getElementActionId(props.before) : undefined}
            after={props.after ? getElementActionId(props.after) : undefined}
        />
    );
});

export const Sidebar = Object.assign(BaseSidebar, {
    Layout,
    Element: BaseElement,
    ElementProperty: Object.assign(BaseElementProperty, ElementPropertyGroups),
    Elements,
    Group: Object.assign(BaseGroup, { Tab }),
    ElementAction: Object.assign(BaseElementAction, {
        IconButton
    }),
    useActiveGroup
});
