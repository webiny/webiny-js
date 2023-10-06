import React from "react";
import { ScrollList, ListItem } from "@webiny/ui/List";
import { ListItemGraphic } from "./UsersTeamsSelection/ListItemGraphic";
import { ListItemText } from "./UsersTeamsSelection/ListItemText";
import { ListItemMeta } from "./UsersTeamsSelection/ListItemMeta";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";

interface UsersTeamsSelectionProps {
    targetsList: any[];
    permissions: any[];
    onRemoveAccess: any;
    onUpdatePermission: any;
}

// We've set scroll list to be non-interactive, but we still need to override the hover color.
const StyledListItem = styled(ListItem)`
    :hover {
        background-color: var(--mdc-theme-background) !important;
    }
`;

export const UsersTeamsSelection: React.FC<UsersTeamsSelectionProps> = ({
    permissions = [],
    targetsList,
    onRemoveAccess,
    onUpdatePermission
}) => {
    const selection = permissions
        .map(permission => {
            const target = targetsList.find(u => u.target === permission.target);
            if (target) {
                return { permission, target };
            }

            return null;
        })
        .filter(Boolean);

    return (
        <>
            <Typography use={"subtitle1"}>People and teams with access</Typography>
            <ScrollList twoLine avatarList style={{ height: 300 }} nonInteractive>
                {selection?.map(item => (
                    <StyledListItem key={item!.permission.target}>
                        <ListItemGraphic {...item} />
                        <ListItemText {...item} />
                        <ListItemMeta
                            {...item!}
                            onRemoveAccess={onRemoveAccess}
                            onUpdatePermission={onUpdatePermission}
                        />
                    </StyledListItem>
                ))}
            </ScrollList>
        </>
    );
};
