import React from "react";
import {
    ListItemText as UiListItemText,
    ListItemTextPrimary,
    ListItemTextSecondary
} from "@webiny/ui/List";
import { useSecurity } from "@webiny/app-security";

interface ListItemTextProps {
    target?: any;
}

export const ListItemText: React.FC<ListItemTextProps> = ({ target }) => {
    const { identity } = useSecurity();

    if (target.type === 'identity') {
        return (
            <UiListItemText>
                <ListItemTextPrimary>
                    {target.name}&nbsp;
                    {target.id === identity!.id && <em>(you)</em>}
                </ListItemTextPrimary>
                <ListItemTextSecondary>{target.meta.email}</ListItemTextSecondary>
            </UiListItemText>
        );
    }

    return <>{target.name}</>;
};
