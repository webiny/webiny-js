import React, { useCallback, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useQuery } from "@apollo/react-hooks";
import { createObjectFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import type { IObjectFieldVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import { useWcp } from "@webiny/app-admin";
import { Grid } from "@webiny/admin-ui";
import {
    LIST_FOLDER_LEVEL_PERMISSIONS_TARGETS,
    UsersTeamsMultiAutocomplete
} from "@webiny/app-aco";
import type { FolderLevelPermissionsTarget } from "@webiny/app-aco";
import type { FieldRule } from "~/types.js";
import { FieldPermissionsSelection } from "~/admin/components/FieldEditor/EditFieldDialog/PermissionsEditor/FieldPermissionsSelection.js";
import { CannotUsePermissions } from "~/admin/components/FieldEditor/EditFieldDialog/PermissionsEditor/CannotUsePermissions.js";

export const CmsAccessControlRulesRenderer = createObjectFieldRenderer(({ field }) => {
    return <AccessControlRules field={field} />;
});

interface AccessControlRulesProps {
    field: IObjectFieldVM;
}

const AccessControlRules = observer(({ field }: AccessControlRulesProps) => {
    const wcp = useWcp();
    const rules: FieldRule[] = Array.isArray(field.value) ? (field.value as FieldRule[]) : [];

    const listTargetsQuery = useQuery(LIST_FOLDER_LEVEL_PERMISSIONS_TARGETS);
    const targetsList: FolderLevelPermissionsTarget[] =
        listTargetsQuery.data?.aco.listFolderLevelPermissionsTargets.data || [];

    const addPermission = useCallback(
        (value: string[]) => {
            const selectedUserOrTeam = value[value.length - 1];
            if (!selectedUserOrTeam) {
                return;
            }
            const newRule: FieldRule = {
                type: "accessControl",
                target: "identity",
                operator: "matches",
                value: selectedUserOrTeam,
                action: "disable"
            };
            field.onChange([...rules, newRule]);
        },
        [rules, field]
    );

    const updatePermission = useCallback(
        ({ rule: updatedRule }: { rule: FieldRule }) => {
            const updated = rules.map(rule =>
                rule.value === updatedRule.value ? updatedRule : rule
            );
            field.onChange(updated);
        },
        [rules, field]
    );

    const removePermission = useCallback(
        ({ rule: removedRule }: { rule: FieldRule }) => {
            field.onChange(rules.filter(rule => rule.value !== removedRule.value));
        },
        [rules, field]
    );

    if (!wcp.canUseHcmsFieldPermissions()) {
        return (
            <Grid>
                <Grid.Column span={12}>
                    <CannotUsePermissions />
                </Grid.Column>
            </Grid>
        );
    }

    const selectedValues = useMemo(
        () => rules.map(rule => String(rule.value) as `admin:${string}` | `team:${string}`),
        [rules]
    );

    return (
        <Grid>
            <Grid.Column span={12}>
                <UsersTeamsMultiAutocomplete
                    options={targetsList}
                    value={selectedValues}
                    onChange={addPermission}
                />
            </Grid.Column>
            <Grid.Column span={12}>
                <FieldPermissionsSelection
                    rules={rules}
                    targetsList={targetsList}
                    onRemoveAccess={removePermission}
                    onUpdatePermission={updatePermission}
                />
            </Grid.Column>
        </Grid>
    );
});
