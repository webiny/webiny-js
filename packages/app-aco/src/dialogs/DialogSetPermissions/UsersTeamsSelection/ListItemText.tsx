import React from "react";
import {
    ListItemText as UiListItemText,
    ListItemTextPrimary,
    ListItemTextSecondary
} from "@webiny/ui/List";
import { useSecurity } from "@webiny/app-security";
import { FolderLevelPermissionsTarget } from "~/types";

interface ListItemTextProps {
    target: FolderLevelPermissionsTarget;
}

export const ListItemText = ({ target }: ListItemTextProps) => {
    const { identity } = useSecurity();

    if (target.type === "admin") {
        return (
            <UiListItemText>
                <ListItemTextPrimary>
                    {target.name}&nbsp;
                    {target.id === identity!.id && <em>(you)</em>}
                </ListItemTextPrimary>
                <ListItemTextSecondary>
                    {target.meta.email || "E-mail not available."}
                </ListItemTextSecondary>
            </UiListItemText>
        );
    }

    return <>{target.name}</>;
};
