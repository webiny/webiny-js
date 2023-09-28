import React, { useCallback, useMemo } from "react";
import { ListActions, ListItemMeta as UiListItemMeta } from "@webiny/ui/List";
import { Menu, MenuDivider, MenuItem } from "@webiny/ui/Menu";
import { ReactComponent as More } from "@material-design-icons/svg/outlined/arrow_drop_down.svg";
import { ReactComponent as Check } from "@material-design-icons/svg/outlined/check.svg";
import { Typography } from "@webiny/ui/Typography";
import styled from "@emotion/styled";
import { useSecurity } from "@webiny/app-security";
import { Tooltip } from "@webiny/ui/Tooltip";

const TARGET_LEVELS = [
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

    div:first-of-type {
        margin-right: 15px;
        width: 20px;
        height: 20px;

        svg {
            fill: var(--mdc-theme-primary);
        }
    }

    div:last-of-type {
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
`;

interface ListItemMetaProps {
    permission: any;
    user?: any;
    team?: any;
    onRemoveAccess: any;
    onUpdatePermission: any;
}

export const ListItemMeta: React.FC<ListItemMetaProps> = ({
    permission,
    user,
    onRemoveAccess,
    onUpdatePermission
}) => {
    const { identity } = useSecurity();

    const currentLevel = useMemo(() => {
        return TARGET_LEVELS.find(level => level.id === permission.level)!;
    }, [permission.level]);

    const disabledReason = useMemo(() => {
        if (permission.inheritedFrom?.startsWith("parent:")) {
            return "Inherited from parent folder.";
        }

        if (identity!.id === user.id) {
            return "You can't change your own permissions.";
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

    const selectLevel = useCallback(e => {
        const targetIndex = e.target.index!;

        const level = TARGET_LEVELS[targetIndex];
        if (!level) {
            // If no level is selected, means that the "Remove access" option was selected.
            onRemoveAccess({ permission });
            return;
        }

        // Needed to do this with a short delay because of a visual glitch. Looks better this way.
        setTimeout(() => {
            onUpdatePermission({
                ...permission,
                level: level.id
            });
        }, 75);
    }, []);

    return (
        <UiListItemMeta>
            <ListActions>
                <Menu
                    handle={handle}
                    disabled={!!disabledReason}
                    onSelect={selectLevel}
                    // Should prevent first item from being autofocused, but it doesn't. 🤷‍
                    focusOnOpen={false}
                >
                    {TARGET_LEVELS.map(level => (
                        <StyledMenuItem key={level.id}>
                            <div>{currentLevel.id === level.id && <Check />}</div>
                            <div>
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
