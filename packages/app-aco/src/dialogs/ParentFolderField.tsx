import React from "react";
import { cn, FormComponentLabel } from "@webiny/admin-ui";

type ParentFolderFieldProps = React.HTMLAttributes<HTMLDivElement> & {
    label?: React.ReactNode;
};

const ParentFolderField = ({
    children,
    label = "Parent folder",
    ...props
}: ParentFolderFieldProps) => {
    return (
        <div {...props}>
            <FormComponentLabel text={label} />
            <div
                className={cn([
                    "px-sm-extra py-sm-extra",
                    "border-sm border-neutral-muted rounded-md",
                    "bg-neutral-base",
                    "max-h-[280px] overflow-x-hidden overflow-y-scroll"
                ])}
            >
                {children}
            </div>
        </div>
    );
};

export { ParentFolderField, type ParentFolderFieldProps };
