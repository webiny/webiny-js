import React from "react";
import { Label } from "@webiny/admin-ui";

export const gridWithPaddingClass = "pt-md";

interface PermissionInfoProps {
    title: string;
}
export const PermissionInfo = ({ title }: PermissionInfoProps) => (
    <div className={"flex items-center h-full"}>
        <Label text={title} />
    </div>
);
