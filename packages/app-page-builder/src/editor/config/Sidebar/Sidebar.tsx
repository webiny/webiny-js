import React from "react";
import { makeDecoratable } from "@webiny/app-admin";
import { Element as BaseElement, ElementProps as BaseElementProps } from "../Element";
import { Layout } from "./Layout";
import {
    Elements as BaseElements,
    ElementsProps as BaseElementsProps
} from "~/editor/config/Elements";
import { Tab } from "./Tab";
import { useActiveGroup } from "~/editor/config/Sidebar/useActiveGroup";
import { StyleSettingsPlugin } from "./StyleSettingsPlugin";
import { IconButton } from "./IconButton";

const SCOPE = "sidebar";

const BaseSidebar = () => {
    return <Layout />;
};

export type ElementProps = Omit<BaseElementProps, "scope">;

const BaseSidebarElement = makeDecoratable("SidebarElement", (props: ElementProps) => {
    return <BaseElement {...props} scope={SCOPE} />;
});

export type ElementsProps = Omit<BaseElementsProps, "scope">;

const Elements = makeDecoratable("SidebarElements", (props: ElementsProps) => {
    return <BaseElements {...props} scope={SCOPE} />;
});

export type GroupProps = Omit<ElementProps, "group">;

const BaseGroup = makeDecoratable("SidebarGroup", (props: GroupProps) => {
    return <BaseSidebarElement {...props} group={"groups"} />;
});

export type ElementActionProps = Omit<ElementProps, "group">;

const BaseElementAction = makeDecoratable("SidebarElementAction", (props: ElementActionProps) => {
    return <BaseSidebarElement {...props} group={"actions"} />;
});

export const Sidebar = Object.assign(BaseSidebar, {
    Layout,
    Element: BaseSidebarElement,
    Elements,
    Group: Object.assign(BaseGroup, { Tab }),
    ElementAction: Object.assign(BaseElementAction, { IconButton }),
    useActiveGroup,
    /* !!! Temporary solution !!! We need this for now, before we move element settings plugins to the new config API. */
    StyleSettingsPlugin
});
