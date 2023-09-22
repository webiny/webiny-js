import React from "react";
import {
    ListItemText as UiListItemText,
    ListItemTextPrimary,
    ListItemTextSecondary
} from "@webiny/ui/List";
import { useSecurity } from "@webiny/app-security";

interface ListItemTextProps {
    user?: any;
    team?: any;
}

export const ListItemText: React.FC<ListItemTextProps> = ({ user, team }) => {
    const { identity } = useSecurity();

    if (user) {
        return (
            <UiListItemText>
                <ListItemTextPrimary>
                    {user.firstName} {user.lastName}&nbsp;
                    {user.id === identity!.id && <em>(you)</em>}
                </ListItemTextPrimary>
                <ListItemTextSecondary>{user.email}</ListItemTextSecondary>
            </UiListItemText>
        );
    }

    return <>{team.name}</>;
};
