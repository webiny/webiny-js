import React, { useCallback } from "react";
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

interface CardHeaderBaseProps extends React.HTMLAttributes<HTMLDivElement> {
    showCloseButton?: boolean;
    onCloseButtonClick?: () => void;
}

const CardHeaderBase = React.forwardRef<HTMLDivElement, CardHeaderBaseProps>(
    ({ className, children, onCloseButtonClick, showCloseButton, ...props }, ref) => {
        return (
            <div ref={ref} className={cn("flex flex-row justify-between", className)} {...props}>
                <div className={cn("flex flex-col space-y-1.5")}>{children}</div>
                {showCloseButton && (
                    <Icon
                        label={"Close"}
                        icon={<XIcon />}
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

const CardContentBase = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => <div ref={ref} className={cn("", className)} {...props} />
);
CardContentBase.displayName = "CardContent";

const CardContent = makeDecoratable("CardContent", CardContentBase);

const CardFooterBase = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("flex items-center", className)} {...props} />
    )
);
CardFooterBase.displayName = "CardFooter";

const CardFooter = makeDecoratable("CardFooter", CardFooterBase);

interface CardProps
    extends Omit<CardRootProps, "children" | "content">,
        VariantProps<typeof cardRootVariants> {
    headerTitle?: React.ReactNode;
    headerDescription?: React.ReactNode;
    content?: React.ReactNode;
    footer?: React.ReactNode;
    showCloseButton?: boolean;
}

const CardBase = (props: CardProps) => {
    const { headerTitle, headerDescription, content, footer, showCloseButton, ...rest } = props;

    const [visible, setVisible] = React.useState(true);
    const hideCard = useCallback(() => setVisible(false), []);

    if (showCloseButton && !visible) {
        return null;
    }

    return (
        <CardRoot {...rest}>
            {(headerTitle || headerDescription) && (
                <CardHeader showCloseButton={showCloseButton} onCloseButtonClick={hideCard}>
                    {typeof headerTitle === "string" ? (
                        <Heading level={4} as={"h1"} text={headerTitle} />
                    ) : (
                        headerTitle
                    )}
                    {typeof headerDescription === "string" ? (
                        <Text text={headerTitle} className={"text-muted-foreground"} />
                    ) : (
                        headerDescription
                    )}
                </CardHeader>
            )}
            {content && <CardContent>{content}</CardContent>}
            {footer && <CardFooter>{footer}</CardFooter>}
        </CardRoot>
    );
};

const Card = makeDecoratable("Card", CardBase);

export { Card, type CardProps };
