import * as React from "react";
import { cn } from "~/utils";
import {makeDecoratable} from "@webiny/react-composition";

type CardRootProps = React.HTMLAttributes<HTMLDivElement>;

const CardRootBase = React.forwardRef<HTMLDivElement, CardRootProps>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(" rounded-lg border bg-card text-card-foreground shadow-sm", className)}
        {...props}
    />
));

CardRootBase.displayName = "CardRoot";

const CardRoot = makeDecoratable("CardRoot", CardRootBase);

const CardHeaderBase = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
    )
);
CardHeaderBase.displayName = "CardHeader";

const CardHeader = makeDecoratable("CardHeader", CardHeaderBase);

const CardTitleBase = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h3
            ref={ref}
            className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
            {...props}
        />
    )
);
CardTitleBase.displayName = "CardTitle";

const CardTitle = makeDecoratable("CardTitle", CardTitleBase);

const CardDescriptionBase = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
CardDescriptionBase.displayName = "CardDescription";

const CardDescription = makeDecoratable("CardDescription", CardDescriptionBase);

const CardContentBase = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
    )
);
CardContentBase.displayName = "CardContent";

const CardContent = makeDecoratable("CardContent", CardContentBase);

const CardFooterBase = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
    )
);
CardFooterBase.displayName = "CardFooter";

const CardFooter = makeDecoratable("CardFooter", CardFooterBase);

interface CardProps extends Omit<CardRootProps, "content"> {
    headerTitle?: React.ReactElement<typeof CardTitleBase>;
    headerDescription?: React.ReactElement<typeof CardDescriptionBase>;
    content?: React.ReactElement<typeof CardContentBase>;
    footer?: React.ReactElement<typeof CardFooterBase>;
}

const CardBase = (props: CardProps) => {
    const { headerTitle, headerDescription, content, footer, ...rest } = props;

    let header: React.ReactNode = null;
    if (headerTitle || headerDescription) {
        header = (
            <CardHeaderBase>
                {headerTitle}
                {headerDescription}
            </CardHeaderBase>
        );
    }

    return (
        <CardRoot {...rest}>
            {header}
            {content}
            {footer}
        </CardRoot>
    );
};

const Card = makeDecoratable("Card", CardBase);

export { Card, CardTitle, CardDescription, CardContent, CardFooter, CardProps };
