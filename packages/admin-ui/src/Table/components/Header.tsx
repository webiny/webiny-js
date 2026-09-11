import * as React from "react";
import { cn, cva, type VariantProps } from "~/utils.js";

const headerVariants = cva("[&_tr]:hover:bg-transparent", {
    variants: {
        sticky: {
            true: "[&_tr]:bg-neutral-base [&_tr]:hover:bg-neutral-base sticky top-0"
        }
    }
});

interface HeaderProps
    extends React.HTMLAttributes<HTMLTableSectionElement>, VariantProps<typeof headerVariants> {}

const Header = ({ className, sticky, ...props }: HeaderProps) => (
    <thead className={cn(headerVariants({ sticky }), className)} {...props} />
);

export { Header, type HeaderProps };
