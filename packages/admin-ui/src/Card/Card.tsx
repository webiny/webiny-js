import * as React from "react";
import { makeDecoratable, withStaticProps } from "~/utils.js";
import { CardContent } from "./components/CardContent.js";
import { CardHeader } from "~/Card/components/CardHeader.js";
import { CardBody } from "~/Card/components/CardBody.js";
import { CardFooter } from "~/Card/components/CardFooter.js";
import { Icon } from "./components/Icon.js";
import { ConfirmButton } from "./components/ConfirmButton.js";
import { CancelButton } from "./components/CancelButton.js";
import { CardProvider } from "~/Card/components/CardProvider.js";

interface CardProps extends Omit<React.ComponentPropsWithoutRef<typeof CardContent>, "title"> {
    title?: React.ReactNode;
    icon?: React.ReactElement;
    description?: React.ReactNode;
    padding?: "sm" | "md" | "lg";
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

const CardBase = (props: CardProps) => {
    const { headerProps, bodyProps, footerProps } = React.useMemo(() => {
        const {
            // Shared props.
            padding,
            actions,
            actionsPosition,
            size,
            variant,

            // Header props.
            title,
            icon,
            description,

            // Body props.
            children,

            // Footer props.
            info
        } = props;

        return {
            headerProps: {
                title,
                icon,
                description,
                padding,
                actions,
                actionsPosition,
                size,
                variant
            },
            bodyProps: { children, padding },
            footerProps: { info, padding, actions, actionsPosition }
        };
    }, [props]);

    return (
        <CardProvider {...props}>
            <CardContent>
                <CardHeader {...headerProps} />
                <CardBody {...bodyProps} />
                <CardFooter {...footerProps} />
            </CardContent>
        </CardProvider>
    );
};

CardBase.displayName = "Card";

const DecoratableCard = makeDecoratable("Card", CardBase);

const Card = withStaticProps(DecoratableCard, {
    ConfirmButton,
    CancelButton,
    Icon
});

export { Card, type CardProps };
