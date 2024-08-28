import * as React from "react";
import { cn } from "~/utils";

type CardWrapperProps = React.HTMLAttributes<HTMLDivElement>;

const CardWrapper = React.forwardRef<HTMLDivElement, CardWrapperProps>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(" rounded-lg border bg-card text-card-foreground shadow-sm", className)}
            {...props}
        />
    )
);
CardWrapper.displayName = "CardWrapper";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
    )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h3
            ref={ref}
            className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
            {...props}
        />
    )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
    )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
    )
);
CardFooter.displayName = "CardFooter";

interface CardProps extends Omit<CardWrapperProps, "content"> {
    headerTitle?: React.ReactNode;
    headerDescription?: React.ReactNode;
    content?: React.ReactNode;
    footer?: React.ReactNode;
}

const Card = (props: CardProps) => {
    const { headerTitle, headerDescription, content, footer, ...rest } = props;
    return (
        <CardWrapper {...rest}>
            <CardHeader>
                <CardTitle>{headerTitle}</CardTitle>
                <CardDescription>{headerDescription}</CardDescription>
            </CardHeader>
            <CardContent>{content}</CardContent>
            <CardFooter>{footer}</CardFooter>
        </CardWrapper>
    );
};

export { Card, CardProps };
