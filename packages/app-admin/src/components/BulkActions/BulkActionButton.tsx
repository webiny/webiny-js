import React from "react";
import { Button } from "@webiny/admin-ui";
import type { ButtonProps } from "@webiny/admin-ui";
import { Tooltip } from "@webiny/admin-ui";

export type BulkActionButtonProps = Omit<ButtonProps, "variant" | "size"> & {
    tooltipContent: React.ReactNode;
};

export const BulkActionButton = ({ tooltipContent, ...other }: BulkActionButtonProps) => {
    const button = <Button variant={"ghost"} {...other} />;
    if (tooltipContent) {
        return <Tooltip side={"bottom"} content={tooltipContent} trigger={button} />;
    }

    return button;
};
