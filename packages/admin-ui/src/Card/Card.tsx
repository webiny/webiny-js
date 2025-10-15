import * as React from "react";
import { makeDecoratable, withStaticProps } from "~/utils.js";
import { CardContent } from "./components/CardContent.js";
import { CardHeader } from "~/Card/components/CardHeader.js";
import { CardBody } from "~/Card/components/CardBody.js";
import { CardFooter } from "~/Card/components/CardFooter.js";
import { CardRoot } from "./components/CardRoot.js";
import { Icon } from "./components/Icon.js";
import { ConfirmButton } from "./components/ConfirmButton.js";
import { CancelButton } from "./components/CancelButton.js";

interface CardProps
    extends Omit<React.ComponentPropsWithoutRef<typeof CardRoot>, "title">,
        Omit<React.ComponentPropsWithoutRef<typeof CardContent>, "title"> {
    title?: React.ReactNode;
    icon?: React.ReactElement;
    bodyPadding?: boolean;
    description?: React.ReactNode;
    children: React.ReactNode;
    actions?: React.ReactNode;
    info?: React.ReactNode;
}

const CardBase = (props: CardProps) => {
    const {
        contentProps,
        headerProps,
        bodyProps,
        footerProps,
    } = React.useMemo(() => {
        const {
            // Shared props.
            size,

            // Header props.
            title,
            icon,
            description,

            // Body props.
            children,
            bodyPadding,

            // Footer props.
            actions,
            info,

            // Content props.
            ...rest
        } = props;

        return {
            headerProps: { title, icon, description, size },
            bodyProps: { children, bodyPadding, size },
            footerProps: { info, actions, size },
            contentProps: { ...rest, size }
        };
    }, [props]);

    return (
        <CardRoot>
            <CardContent {...contentProps}>
                <CardHeader {...headerProps} />
                <CardBody {...bodyProps} />
                <CardFooter {...footerProps} />
            </CardContent>
        </CardRoot>
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
