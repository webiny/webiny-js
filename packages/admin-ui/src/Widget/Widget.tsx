import * as React from "react";
import { makeDecoratable, withStaticProps } from "~/utils.js";
import { WidgetContent } from "./components/WidgetContent.js";
import { WidgetHeader } from "~/Widget/components/WidgetHeader.js";
import { WidgetBody } from "~/Widget/components/WidgetBody.js";
import { WidgetFooter } from "~/Widget/components/WidgetFooter.js";
import { Icon } from "./components/Icon.js";
import { ConfirmAction } from "./components/ConfirmAction.js";
import { CancelAction } from "./components/CancelAction.js";
import { WidgetPropsProvider } from "~/Widget/components/WidgetPropsProvider.js";

interface WidgetProps extends Omit<React.ComponentPropsWithoutRef<typeof WidgetContent>, "title"> {
    title?: React.ReactNode;
    icon?: React.ReactElement;
    description?: React.ReactNode;
    padding?: "sm" | "md" | "lg";
    bodyPadding?: boolean;
    variant?: "default" | "accent";
    elevation?: "none" | "small" | "medium" | "large";
    size?: "sm" | "md";
    cornerSize?: "md" | "lg";
    actions?: React.ReactNode;
    actionsPosition?: "header" | "footer";
    actionsSize?: "sm" | "md";
    info?: React.ReactNode;
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
    ConfirmAction,
    CancelAction,
    Icon
});

export { Widget, type WidgetProps };
