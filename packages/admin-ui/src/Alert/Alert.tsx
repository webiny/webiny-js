import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/utils";
import { makeDecoratable } from "@webiny/react-composition";

const alertVariants = cva(
    "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
    {
        variants: {
            variant: {
                default: "bg-background text-foreground",
                destructive:
                    "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"
            }
        },
        defaultVariants: {
            variant: "default"
        }
    }
);

type AlertWrapperProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>;

const AlertWrapper = React.forwardRef<HTMLDivElement, AlertWrapperProps>(
    ({ className, variant, ...props }, ref) => (
        <div
            ref={ref}
            role="alert"
            className={cn(alertVariants({ variant }), className)}
            {...props}
        />
    )
);

AlertWrapper.displayName = "AlertWrapper";

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h5
            ref={ref}
            className={cn("mb-1 font-medium leading-none tracking-tight", className)}
            {...props}
        />
    )
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";

interface AlertProps extends Omit<AlertWrapperProps, "title"> {
    title: React.ReactNode;
    text: React.ReactNode;
}

const AlertBase = (props: AlertProps) => {
    const { title, text, ...rest } = props;

    return (
        <AlertWrapper {...rest}>
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>{text}</AlertDescription>
        </AlertWrapper>
    );
};

AlertBase.displayName = "Alert";

const Alert = makeDecoratable("Alert", AlertBase);

export { Alert, AlertProps };
