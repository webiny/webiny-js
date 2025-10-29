import React from "react";
import { cn, Text } from "@webiny/admin-ui";

interface GroupOperationLabelProps {
    operation: string;
    show: boolean;
}
export const GroupOperationLabel = ({ operation, show }: GroupOperationLabelProps) => {
    if (!show) {
        return null;
    }

    return (
        <span
            className={cn([
                "bg-neutral-base rounded-xxl px-md py-xs",
                "w-[56px] h-[28px]",
                "absolute -bottom-[15px] left-1/2 -ml-[46px] z-50"
            ])}
        >
            <Text size={"sm"}>{operation}</Text>
        </span>
    );
};
