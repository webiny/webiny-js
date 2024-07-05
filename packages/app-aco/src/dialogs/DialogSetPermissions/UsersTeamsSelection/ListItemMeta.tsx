import React, { useMemo } from "react";
import { ListActions, ListItemMeta as UiListItemMeta } from "@webiny/ui/List";
import { Menu, MenuDivider, MenuItem } from "@webiny/ui/Menu";
import { ReactComponent as More } from "@material-design-icons/svg/outlined/arrow_drop_down.svg";
import { ReactComponent as Check } from "@material-design-icons/svg/outlined/check.svg";
import { Typography } from "@webiny/ui/Typography";
import styled from "@emotion/styled";
import { useSecurity } from "@webiny/app-security";
import { Tooltip } from "@webiny/ui/Tooltip";
import { FolderAccessLevel, FolderLevelPermissionsTarget, FolderPermission } from "~/types";

const TARGET_LEVELS = [
    {
        id: "public",
        label: "Public",
        description: "Everybody can view content (public folder)"
    },
    {
        id: "viewer",
        label: "Viewer",
        description: "Can view content, but not modify it"
    },
    {
        id: "editor",
        label: "Editor",
        description: "Can view and modify content"
    },
    {
        id: "owner",
        label: "Owner",
        description: "Can edit and manage content permissions"
    }
];

const StyledHandle = styled.div<{ disabled: boolean }>`
    display: flex;
    color: var(--mdc-theme-text-primary-on-background);
    cursor: pointer;
    padding: 20px 0 20px 20px;
    ${({ disabled }) => disabled && `opacity: 0.5; pointer-events: none;`}
`;

const StyledMenuItem = styled(MenuItem)`
    display: flex;
    padding-top: 5px;
    padding-bottom: 5px;

    div.selected {
        margin-right: 15px;
        width: 20px;
        height: 20px;

        svg {
            fill: var(--mdc-theme-primary);
        }
    }

    div.info {
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
`;

interface ListItemMetaProps {
    permission: FolderPermission;
    target: FolderLevelPermissionsTarget;
    targetsList: FolderLevelPermissionsTarget[];
    onRemoveAccess: (params: { permission: FolderPermission }) => void;
    onUpdatePermission: (params: { permission: FolderPermission }) => void;
}

export const ListItemMeta = ({
    permission,
    target,
    targetsList,
    onRemoveAccess,
    onUpdatePermission
}: ListItemMetaProps) => {
    const { identity } = useSecurity();

    console.log("permission", permission);
    const currentLevel = useMemo(() => {
        return TARGET_LEVELS.find(level => level.id === permission.level)!;
    }, [permission.level]);

    console.log("currentLevel", currentLevel);
    const disabledReason = useMemo(() => {
        if (permission.inheritedFrom?.startsWith("parent:")) {
            return "Inherited from parent folder.";
        }

        if (identity!.id === target.id) {
            let message = "You can't change your own permissions.";
            if (permission.inheritedFrom?.startsWith("team:")) {
                const team = targetsList.find(t => t.target === permission.inheritedFrom);
                message += " Access to this folder is managed by a team";
                if (team) {
                    message += ` (${team.name})`;
                }
                message += ".";
            }
            return message;
        }

        return null;
    }, [permission]);

    const handle = useMemo(() => {
        let handle = (
            <StyledHandle disabled={!!disabledReason}>
                <Typography use="body1">{currentLevel.label}</Typography>
                <More />
            </StyledHandle>
        );

        if (disabledReason) {
            handle = <Tooltip content={disabledReason}>{handle}</Tooltip>;
        }

        return handle;
    }, [disabledReason, currentLevel.label]);

    return (
        <UiListItemMeta>
            <ListActions>
                <Menu
                    handle={handle}
                    disabled={!!disabledReason}
                    // Should prevent first item from being autofocused, but it doesn't. 🤷‍
                    focusOnOpen={false}
                >
                    {TARGET_LEVELS.map(level => (
                        <StyledMenuItem
                            key={level.id}
                            onClick={() => {
                                // Needed to do this with a short delay because of a visual glitch.
                                setTimeout(() => {
                                    onUpdatePermission({
                                        permission: {
                                            ...permission,
                                            level: level.id as FolderAccessLevel
                                        }
                                    });
                                }, 75);
                            }}
                        >
                            <div className="selected">
                                {currentLevel.id === level.id && <Check />}
                            </div>
                            <div className="info">
                                <Typography use="body1">{level.label}</Typography>
                                <Typography use="caption">{level.description}</Typography>
                            </div>
                        </StyledMenuItem>
                    ))}
                    <MenuDivider />
                    <MenuItem onClick={() => onRemoveAccess({ permission })}>
                        Remove access
                    </MenuItem>
                </Menu>
            </ListActions>
        </UiListItemMeta>
    );
};
