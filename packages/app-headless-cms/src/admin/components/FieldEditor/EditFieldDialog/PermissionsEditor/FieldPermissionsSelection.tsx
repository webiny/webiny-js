import React, { useMemo } from "react";
import { ReactComponent as More } from "@webiny/icons/arrow_drop_down.svg";
import { Button, DropdownMenu, List, Text, Avatar } from "@webiny/admin-ui";
import type { FolderLevelPermissionsTarget } from "@webiny/app-aco";
import type { FieldRule } from "~/types.js";

const FIELD_ACCESS_LEVELS = [
    {
        id: "hide",
        label: "No Access",
        description: "Hide this field from the user."
    },
    {
        id: "disable",
        label: "Viewer (Read-only)",
        description: "Allow the user to read, but not edit, this field."
    }
];

interface FieldPermissionsSelectionProps {
    targetsList: FolderLevelPermissionsTarget[];
    rules: FieldRule[];
    onRemoveAccess: (params: { rule: FieldRule }) => void;
    onUpdatePermission: (params: { rule: FieldRule }) => void;
}

type Selection = Array<{ rule: FieldRule; target: FolderLevelPermissionsTarget }>;

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
    rule: FieldRule;
    onRemoveAccess: (params: { rule: FieldRule }) => void;
    onUpdatePermission: (params: { rule: FieldRule }) => void;
}

const ListItemMeta = ({ rule, onRemoveAccess, onUpdatePermission }: ListItemMetaProps) => {
    const currentLevel = useMemo(() => {
        return FIELD_ACCESS_LEVELS.find(level => level.id === rule.action)!;
    }, [rule.action]);

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
                                rule: {
                                    ...rule,
                                    action: level.id
                                }
                            });
                        }, 75);
                    }}
                />
            ))}
            <DropdownMenu.Separator />
            <DropdownMenu.Item
                onClick={() => onRemoveAccess({ rule })}
                text={"Remove permission"}
            />
        </DropdownMenu>
    );
};

export const FieldPermissionsSelection = ({
    rules = [],
    targetsList,
    onRemoveAccess,
    onUpdatePermission
}: FieldPermissionsSelectionProps) => {
    const selection = rules
        .map(rule => {
            const target = targetsList.find(u => u.target === String(rule.value));
            if (target) {
                return { rule, target };
            }

            return null;
        })
        .filter(Boolean) as Selection;

    const hasRules = selection.length > 0;

    return (
        <>
            {hasRules ? (
                <Text as={"div"} className={"mb-md"}>
                    People and teams with access
                </Text>
            ) : null}
            <List>
                {selection?.map(item => (
                    <List.Item
                        key={String(item.rule.value)}
                        title={<ListItemText target={item.target} />}
                        icon={<ListItemGraphic target={item.target} />}
                        actions={
                            <ListItemMeta
                                rule={item.rule}
                                onRemoveAccess={onRemoveAccess}
                                onUpdatePermission={onUpdatePermission}
                            />
                        }
                    />
                ))}
            </List>
        </>
    );
};
