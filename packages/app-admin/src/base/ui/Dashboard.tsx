import React from "react";
import { makeComposable } from "@webiny/app";
import { createDecoratorFactory } from "@webiny/react-composition";

const View = makeComposable("Dashboard", () => {
    return <DashboardRenderer />;
});

export const DashboardRenderer = makeComposable("DashboardRenderer");

const Container = makeComposable("DashboardContainer");

const Header = makeComposable("DashboardHeader");

const Widgets = makeComposable<{ title?: string }>("DashboardWidgets");

const Footer = makeComposable("DashboardFooter");

export const DashboardView = Object.assign(View, {
    createDecorator: createDecoratorFactory()(View),
    Container: Object.assign(Container, { createDecorator: createDecoratorFactory()(Container) }),
    Header: Object.assign(Header, { createDecorator: createDecoratorFactory()(Header) }),
    Widgets: Object.assign(Widgets, { createDecorator: createDecoratorFactory()(Widgets) }),
    Footer: Object.assign(Footer, { createDecorator: createDecoratorFactory()(Footer) })
});
