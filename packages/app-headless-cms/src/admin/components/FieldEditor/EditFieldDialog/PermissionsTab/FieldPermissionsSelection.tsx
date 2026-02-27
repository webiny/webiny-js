import React, { useMemo } from "react";
import { ReactComponent as More } from "@webiny/icons/arrow_drop_down.svg";
import { Button, DropdownMenu, List, Scrollbar, Text, Avatar } from "@webiny/admin-ui";
import type { FolderLevelPermissionsTarget } from "@webiny/app-aco";
import type { FieldAccessLevel, FieldPermission } from "~/types.js";

const FIELD_ACCESS_LEVELS = [
    {
        id: "no-access",
        label: "No Access",
        description: "Hide this field from the user."
    },
    {
        id: "viewer",
        label: "Viewer (Read-only)",
        description: "Allow the user to read, but not edit, this field."
    }
];

interface FieldPermissionsSelectionProps {
    targetsList: FolderLevelPermissionsTarget[];
    permissions: FieldPermission[];
    onRemoveAccess: (params: { permission: FieldPermission }) => void;
    onUpdatePermission: (params: { permission: FieldPermission }) => void;
}

type Selection = Array<{ permission: FieldPermission; target: FolderLevelPermissionsTarget }>;

interface ListItemGraphicProps {
    target: FolderLevelPermissionsTarget;
}

const ListItemGraphic = ({ target }: ListItemGraphicProps) => {
    if (target.type === "admin") {
        return (
            <Avatar
                size={"md"}
                image={<Avatar.Image src={target.meta.image} alt={"User's avatar."} />}
                fallback={<Avatar.Fallback delayMs={0}>{target.name.charAt(0)}</Avatar.Fallback>}
            />
        );
    }

    return (
        <Avatar
            size={"md"}
            fallback={<Avatar.Fallback delayMs={0}>{target.name.charAt(0)}</Avatar.Fallback>}
        />
    );
};

interface ListItemTextProps {
    target: FolderLevelPermissionsTarget;
}

const ListItemText = ({ target }: ListItemTextProps) => {
    if (target.type === "admin") {
        return (
            <div>
                <Text as="div">{target.name}</Text>
                <Text as={"div"} size={"sm"} className={"text-neutral-strong font-normal"}>
                    {target.meta.email || "E-mail not available."}
                </Text>
            </div>
        );
    }

    return <>{target.name}</>;
};

interface ListItemMetaProps {
    permission: FieldPermission;
    onRemoveAccess: (params: { permission: FieldPermission }) => void;
    onUpdatePermission: (params: { permission: FieldPermission }) => void;
}

const ListItemMeta = ({ permission, onRemoveAccess, onUpdatePermission }: ListItemMetaProps) => {
    const currentLevel = useMemo(() => {
        return FIELD_ACCESS_LEVELS.find(level => level.id === permission.accessLevel)!;
    }, [permission.accessLevel]);

    const handle = (
        <Button variant={"ghost"} text={currentLevel.label} icon={<More />} iconPosition={"end"} />
    );

    return (
        <DropdownMenu trigger={handle}>
            {FIELD_ACCESS_LEVELS.map(level => (
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
                        setTimeout(() => {
                            onUpdatePermission({
                                permission: {
                                    ...permission,
                                    accessLevel: level.id as FieldAccessLevel
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
            />
        </DropdownMenu>
    );
};

export const FieldPermissionsSelection = ({
    permissions = [],
    targetsList,
    onRemoveAccess,
    onUpdatePermission
}: FieldPermissionsSelectionProps) => {
    const selection = permissions
        .map(permission => {
            const target = targetsList.find(u => u.target === permission.target);
            if (target) {
                return { permission, target };
            }

            return null;
        })
        .filter(Boolean) as Selection;

    return (
        <>
            <Text as={"div"} className={"mb-md"}>
                People and teams with access
            </Text>
            <Scrollbar style={{ minHeight: "100px" }}>
                <List>
                    {selection?.map(item => (
                        <List.Item
                            key={item.permission.target}
                            title={<ListItemText target={item.target} />}
                            icon={<ListItemGraphic target={item.target} />}
                            actions={
                                <ListItemMeta
                                    permission={item.permission}
                                    onRemoveAccess={onRemoveAccess}
                                    onUpdatePermission={onUpdatePermission}
                                />
                            }
                        />
                    ))}
                </List>
            </Scrollbar>
        </>
    );
};
