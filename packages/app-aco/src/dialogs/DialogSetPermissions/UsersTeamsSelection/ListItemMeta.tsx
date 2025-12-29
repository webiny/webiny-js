import React, { useMemo } from "react";
import { ReactComponent as More } from "@webiny/icons/arrow_drop_down.svg";
import { Button, DropdownMenu, Text, Tooltip } from "@webiny/admin-ui";
import { useSecurity } from "@webiny/app-admin";
import type { FolderAccessLevel, FolderLevelPermissionsTarget, FolderPermission } from "~/types.js";

const TARGET_LEVELS = [
    {
        id: "no-access",
        label: "No Access",
        description: "Cannot view or modify content"
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

    const currentLevel = useMemo(() => {
        return TARGET_LEVELS.find(level => level.id === permission.level)!;
    }, [permission.level]);

    const { isListDisabled, isRemovePermissionDisabled, tooltipMessage } = useMemo(() => {
        let message = null;
        let disabled = false;
        let removePermissionDisabled = false;

        if (permission.inheritedFrom?.startsWith("parent:")) {
            message = "Inherited from parent folder.";
            disabled = false; // Still allow interaction, just inform user
            removePermissionDisabled = true;
        }

        if (identity!.id === target.id) {
            message = "You can't change your own permissions.";
            if (permission.inheritedFrom?.startsWith("team:")) {
                const team = targetsList.find(t => t.target === permission.inheritedFrom);
                message += " Access to this folder is managed by a team";
                if (team) {
                    message += ` (${team.name})`;
                }
                message += ".";
            }
            disabled = true;
            removePermissionDisabled = true;
        }

        return {
            isListDisabled: disabled,
            isRemovePermissionDisabled: removePermissionDisabled,
            tooltipMessage: message
        };
    }, [permission, identity, target, targetsList]);

    const handle = useMemo(() => {
        let handle = (
            <Button
                variant={"ghost"}
                disabled={!!isListDisabled}
                text={currentLevel.label}
                icon={<More />}
                iconPosition={"end"}
            />
        );

        if (tooltipMessage) {
            handle = <Tooltip content={tooltipMessage} trigger={handle} />;
        }

        return handle;
    }, [tooltipMessage, isListDisabled, currentLevel.label]);

    return (
        <DropdownMenu trigger={handle}>
            {TARGET_LEVELS.map(level => (
                <DropdownMenu.CheckboxItem
                    key={level.id}
                    checked={currentLevel.id === level.id}
                    text={
                        <div>
                            <Text as={"div"}>{level.label}</Text>
                            <Text as={"div"} size={"sm"} className={"text-neutral-strong"}>
                                {level.description}
                            </Text>
                        </div>
                    }
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
                />
            ))}
            <DropdownMenu.Separator />
            <DropdownMenu.Item
                onClick={() => onRemoveAccess({ permission })}
                text={"Remove permission"}
                disabled={isRemovePermissionDisabled}
            />
        </DropdownMenu>
    );
};
