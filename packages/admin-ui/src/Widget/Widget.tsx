import * as React from "react";
import { makeDecoratable, withStaticProps } from "~/utils.js";
import { WidgetContent } from "./components/WidgetContent.js";
import { WidgetHeader } from "~/Widget/components/WidgetHeader.js";
import { WidgetBody } from "~/Widget/components/WidgetBody.js";
import { WidgetFooter } from "~/Widget/components/WidgetFooter.js";
import { Icon } from "./components/Icon.js";
import { WidgetAction } from "./components/WidgetAction.js";
import { WidgetPropsProvider } from "~/Widget/components/WidgetPropsProvider.js";

interface WidgetProps extends Omit<React.ComponentPropsWithoutRef<typeof WidgetContent>, "title"> {
    title?: React.ReactNode;
    icon?: React.ReactElement;
    description?: React.ReactNode;
    padding?: "sm" | "md";
    bodyPadding?: boolean;
    variant?: "accent" | "light" | "base";
    elevation?: "none" | "sm" | "md" | "lg";
    headerActions?: React.ReactNode;
    footerStartActions?: React.ReactNode;
    footerEndActions?: React.ReactNode;
    outline?: boolean;
    children: React.ReactNode;
}

const WidgetBase = (props: WidgetProps) => {
    return (
        <WidgetPropsProvider props={props}>
            <WidgetContent>
                <WidgetHeader />
                <WidgetBody />
                <WidgetFooter />
            </WidgetContent>
        </WidgetPropsProvider>
    );
};

WidgetBase.displayName = "Widget";

const DecoratableWidget = makeDecoratable("Widget", WidgetBase);

const Widget = withStaticProps(DecoratableWidget, {
    Action: WidgetAction,
    Icon
});

export { Widget, type WidgetProps };
