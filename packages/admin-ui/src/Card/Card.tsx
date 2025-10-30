import * as React from "react";
import { makeDecoratable, withStaticProps } from "~/utils.js";
import { CardContent } from "./components/CardContent.js";
import { CardHeader } from "~/Card/components/CardHeader.js";
import { CardBody } from "~/Card/components/CardBody.js";
import { CardFooter } from "~/Card/components/CardFooter.js";
import { Icon } from "./components/Icon.js";
import { ConfirmButton } from "./components/ConfirmButton.js";
import { CancelButton } from "./components/CancelButton.js";
import { CardPropsProvider } from "~/Card/components/CardPropsProvider.js";

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
    return (
        <CardPropsProvider props={props}>
            <CardContent>
                <CardHeader />
                <CardBody/>
                <CardFooter  />
            </CardContent>
        </CardPropsProvider>
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
