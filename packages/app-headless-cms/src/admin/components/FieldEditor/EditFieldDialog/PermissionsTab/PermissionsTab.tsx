import React from "react";
import { useQuery } from "@apollo/react-hooks";
import { Grid } from "@webiny/admin-ui";
import { useBind } from "@webiny/form";
import {
    LIST_FOLDER_LEVEL_PERMISSIONS_TARGETS,
    UsersTeamsMultiAutocomplete
} from "@webiny/app-aco";
import type { FolderLevelPermissionsTarget } from "@webiny/app-aco";
import type { FieldRule } from "~/types.js";
import { FieldPermissionsSelection } from "./FieldPermissionsSelection.js";

export const PermissionsTab = ({ gridClassName }: { gridClassName?: string }) => {
    const bind = useBind({ name: "rules" });
    const allRules: FieldRule[] = bind.value || [];
    const accessRules = allRules.filter(r => r.type === "accessControl");
    const otherRules = allRules.filter(r => r.type !== "accessControl");

    const listTargetsQuery = useQuery(LIST_FOLDER_LEVEL_PERMISSIONS_TARGETS);
    const targetsList: FolderLevelPermissionsTarget[] =
        listTargetsQuery.data?.aco.listFolderLevelPermissionsTargets.data || [];

    const addPermission = (value: string[]) => {
        const selectedUserOrTeam = value[value.length - 1];
        const newRule: FieldRule = {
            type: "accessControl",
            target: "identity",
            operator: "matches",
            value: selectedUserOrTeam,
            action: "disable"
        };

        bind.onChange([...otherRules, ...accessRules, newRule]);
    };

    const updatePermission = ({ rule: updatedRule }: { rule: FieldRule }) => {
        const updatedAccessRules = accessRules.map(rule => {
            if (rule.value === updatedRule.value) {
                return updatedRule;
            }
            return rule;
        });
        bind.onChange([...otherRules, ...updatedAccessRules]);
    };

    const removeUserTeam = ({ rule: removedRule }: { rule: FieldRule }) => {
        const updatedAccessRules = accessRules.filter(rule => rule.value !== removedRule.value);
        bind.onChange([...otherRules, ...updatedAccessRules]);
    };

    return (
        <Grid className={gridClassName}>
            <Grid.Column span={12}>
                <UsersTeamsMultiAutocomplete
                    options={targetsList}
                    value={accessRules.map(
                        rule => String(rule.value) as `admin:${string}` | `team:${string}`
                    )}
                    onChange={addPermission}
                />
            </Grid.Column>
            <Grid.Column span={12}>
                <FieldPermissionsSelection
                    rules={accessRules}
                    targetsList={targetsList}
                    onRemoveAccess={removeUserTeam}
                    onUpdatePermission={updatePermission}
                />
            </Grid.Column>
        </Grid>
    );
};
