import * as React from "react";
import { cn, cva, Grid, Heading, Icon, type VariantProps } from "@webiny/admin-ui";

const simpleFormInnerVariants = cva("mx-auto", {
    variants: {
        size: {
            md: "max-w-[640px]",
            lg: "max-w-[800px]",
            full: "max-w-full"
        }
    },
    defaultVariants: {
        size: "md"
    }
});

interface SimpleFormProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof simpleFormInnerVariants> {
    children: React.ReactNode;
    noElevation?: boolean;
    className?: string;
}

export const SimpleForm = ({ children, className, size, ...props }: SimpleFormProps) => {
    return (
        <div {...props} className={cn(["webiny-data-list", "mx-auto p-lg", "relative"], className)}>
            <div className={cn(simpleFormInnerVariants({ size }))}>{children}</div>
        </div>
    );
};

const simpleFormHeaderVariants = cva("p-md pl-lg border-sm border-neutral-dimmed-darker", {
    variants: {
        rounded: {
            true: "rounded-t-3xl"
        }
    },
    defaultVariants: {
        rounded: true
    }
});

interface SimpleFormHeaderProps
    extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
        VariantProps<typeof simpleFormHeaderVariants> {
    title: React.ReactNode;
    icon?: React.ReactElement<any>;
    children?: React.ReactNode;
    ["data-testid"]?: string;
}

export const SimpleFormHeader = ({
    children,
    icon,
    title,
    className,
    rounded,
    ...props
}: SimpleFormHeaderProps) => {
    return (
        <div
            className={cn(simpleFormHeaderVariants({ rounded }), className)}
            data-testid={props["data-testid"]}
        >
            <Grid>
                <Grid.Column span={children ? 6 : 12}>
                    <>
                        {icon && <Icon label={title as string} icon={icon} />}
                        <Heading level={4} className={"truncate"}>
                            {title}
                        </Heading>
                    </>
                </Grid.Column>
                <>{children ? <Grid.Column span={6}>{children}</Grid.Column> : null}</>
            </Grid>
        </div>
    );
};

export interface SimpleFormFooterProps {
    children?: React.ReactNode;
    className?: string;
}

export const SimpleFormFooter = ({ children, className }: SimpleFormFooterProps) => {
    return (
        <div
            className={cn(
                "p-lg pt-none border-sm border-t-none border-neutral-dimmed-darker rounded-b-3xl",
                "flex justify-end gap-sm",
                className
            )}
        >
            {children || null}
        </div>
    );
};

interface SimpleFormContentProps {
    children: React.ReactNode;
    className?: string;
}

export const SimpleFormContent = ({ children, className }: SimpleFormContentProps) => {
    return (
        <div className={cn("p-lg border-sm border-y-none border-neutral-dimmed-darker", className)}>
            {children}
        </div>
    );
};
