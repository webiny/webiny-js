import React from "react";
import { cn } from "~/utils";
import { makeDecoratable } from "@webiny/react-composition";
import { Heading } from "~/Heading";
import { Text } from "~/Text";
import { ReactComponent as XIcon } from "@material-design-icons/svg/filled/close.svg";
import { Icon } from "~/Icon";
import { cva, type VariantProps } from "class-variance-authority";

const cardRootVariants = cva("space-y-6 border bg-card text-card-foreground", {
    variants: {
        padding: {
            standard: "p-6",
            comfortable: "p-8",
            compact: "p-4"
        },
        elevation: {
            none: "",
            xs: "shadow-xs",
            sm: "shadow-sm",
            md: "shadow-md",
            lg: "shadow-lg",
            xl: "shadow-xl"
        },
        borderRadius: {
            none: "rounded-none",
            sm: "rounded-sm",
            md: "rounded-md",
            lg: "rounded-lg"
        }
    },
    defaultVariants: {
        padding: "standard",
        elevation: "none",
        borderRadius: "md"
    }
});

interface CardRootProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof cardRootVariants> {}

const CardRootBase = React.forwardRef<HTMLDivElement, CardRootProps>(
    ({ className, padding, elevation, borderRadius, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(cardRootVariants({ padding, elevation, borderRadius, className }))}
            {...props}
        />
    )
);

CardRootBase.displayName = "CardRoot";

const CardRoot = makeDecoratable("CardRoot", CardRootBase);

interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "content" | "title"> {
    showCloseButton?: boolean;
    onCloseButtonClick?: () => void;
    title?: React.ReactNode;
    description?: React.ReactNode;
    content?: React.ReactNode;
}

const CardHeaderBase = React.forwardRef<HTMLDivElement, CardHeaderProps>(
    (
        { className, title, description, content, onCloseButtonClick, showCloseButton, ...props },
        ref
    ) => {
        return (
            <div ref={ref} className={cn("flex flex-row justify-between", className)} {...props}>
                <div className={cn("flex flex-col space-y-1.5")}>
                    {typeof title === "string" ? (
                        <Heading level={6} as={"h1"} text={title} />
                    ) : (
                        title
                    )}
                    {typeof description === "string" ? (
                        <Text text={description} className={"text-muted-foreground"} />
                    ) : (
                        description
                    )}
                    {content}
                </div>
                {showCloseButton && (
                    <Icon
                        label={"Close"}
                        icon={<XIcon />}
                        color={"dark"}
                        onClick={onCloseButtonClick}
                        className={"cursor-pointer"}
                    />
                )}
            </div>
        );
    }
);
CardHeaderBase.displayName = "CardHeader";

const CardHeader = makeDecoratable("CardHeader", CardHeaderBase);

interface CardContentProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "content"> {
    content?: React.ReactNode;
}

const CardContentBase = React.forwardRef<HTMLDivElement, CardContentProps>(
    ({ content, ...props }, ref) => (
        <div ref={ref} {...props}>
            {content}
        </div>
    )
);

CardContentBase.displayName = "CardContent";

const CardContent = makeDecoratable("CardContent", CardContentBase);

interface CardFooterProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "content"> {
    content?: React.ReactNode;
}

const CardFooterBase = React.forwardRef<HTMLDivElement, CardFooterProps>(
    ({ content, className, ...props }, ref) => (
        <div ref={ref} className={cn("flex items-center", className)} {...props}>
            {content}
        </div>
    )
);
CardFooterBase.displayName = "CardFooter";

const CardFooter = makeDecoratable("CardFooter", CardFooterBase);

interface CardProps
    extends Omit<CardRootProps, "children" | "content">,
        VariantProps<typeof cardRootVariants> {
    header?: React.ReactElement<CardHeaderProps>;
    content?: React.ReactElement<CardContentProps>;
    footer?: React.ReactElement<CardFooterProps>;
}

const CardBase = (props: CardProps) => {
    const { header, content, footer, ...rest } = props;

    const [visible, setVisible] = React.useState(true);
    const onCloseButtonClick = React.useCallback(() => {
        setVisible(false);
        const onCloseButtonClick = header?.props?.onCloseButtonClick;
        if (onCloseButtonClick) {
            onCloseButtonClick();
        }
    }, [header?.props?.onCloseButtonClick]);

    const headerClone = React.useMemo(() => {
        if (!header) {
            return null;
        }

        return React.cloneElement(header, { onCloseButtonClick });
    }, [header]);

    if (!visible) {
        return null;
    }

    return (
        <CardRoot {...rest}>
            {headerClone}
            {content}
            {footer}
        </CardRoot>
    );
};

const Card = makeDecoratable("Card", CardBase);

export { Card, CardHeader, CardContent, CardFooter, type CardProps };
