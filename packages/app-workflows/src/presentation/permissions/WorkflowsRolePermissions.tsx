import React from "react";
import { Checkbox } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { SegmentedControl } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { SegmentedControlItemParams } from "@webiny/admin-ui";
import { usePermissionValue } from "@webiny/app-admin";
import { ReactComponent as InfoIcon } from "@webiny/icons/info.svg";
import { changeWorkflowsAccessLevel } from "~/domain/permissions/changeWorkflowsAccessLevel.js";
import { getWorkflowsAccessNote } from "~/domain/permissions/getWorkflowsAccessNote.js";
import { readWorkflowsAccess } from "~/domain/permissions/readWorkflowsAccess.js";
import { writeWorkflowsAccess } from "~/domain/permissions/writeWorkflowsAccess.js";
import { WORKFLOWS_ACCESS_COPY } from "~/domain/permissions/workflowsAccessCopy.js";
import type { WorkflowsAccess } from "~/domain/permissions/WorkflowsAccess.js";
import type { WorkflowsAccessLevel } from "~/domain/permissions/WorkflowsAccessLevel.js";

const LEVEL_ITEMS: SegmentedControlItemParams[] = [
    { value: "none", label: WORKFLOWS_ACCESS_COPY.noAccess },
    { value: "full", label: WORKFLOWS_ACCESS_COPY.fullAccess },
    { value: "custom", label: WORKFLOWS_ACCESS_COPY.custom }
];

const EDITOR_ID = "workflows-access-editor";
const EDITOR_DESCRIPTION_ID = "workflows-access-editor-description";
const REASSIGN_ID = "workflows-access-reassign";
const REASSIGN_DESCRIPTION_ID = "workflows-access-reassign-description";

const toAccessLevel = (selected: string): WorkflowsAccessLevel | null => {
    if (selected === "none" || selected === "full" || selected === "custom") {
        return selected;
    }
    return null;
};

/*
 * The Workflows group of the role form and the API key form (R333, Q60, design DS:103-135). A thin
 * controlled component: the permission list from `usePermissionValue` is the state and the pure
 * functions of `domain/permissions` read and write it. `onChange` runs only on a user action that
 * changes the group, never on mount, so opening a role does not dirty the form and a legacy
 * `{ name: "workflows.*", editor: true }` is rewritten only when the admin changes the group. A `*`
 * or other pattern entry the server matches against `workflows.*` shows as Full with every control
 * disabled. No AACL check: workflows has its own licence.
 */
export const WorkflowsRolePermissions = () => {
    const { value, onChange } = usePermissionValue();
    const access = readWorkflowsAccess(value);
    const note = getWorkflowsAccessNote(access);

    const changeLevel = (selected: string): void => {
        const level = toAccessLevel(selected);
        if (level === null || access.locked || level === access.level) {
            return;
        }
        const next = changeWorkflowsAccessLevel(access, level);
        const permissions = writeWorkflowsAccess(value, next);
        onChange(permissions);
    };

    const changeEditor = (checked: boolean): void => {
        if (access.locked) {
            return;
        }
        const next: WorkflowsAccess = { ...access, editor: checked };
        const permissions = writeWorkflowsAccess(value, next);
        onChange(permissions);
    };

    const changeReassign = (checked: boolean): void => {
        if (access.locked) {
            return;
        }
        const next: WorkflowsAccess = { ...access, reassign: checked };
        const permissions = writeWorkflowsAccess(value, next);
        onChange(permissions);
    };

    return (
        <div className={"flex flex-col gap-md pt-md"}>
            <SegmentedControl
                label={WORKFLOWS_ACCESS_COPY.levelLabel}
                items={LEVEL_ITEMS}
                value={access.level}
                disabled={access.locked}
                onChange={changeLevel}
            />
            {access.level === "custom" && (
                <div className={"flex flex-col gap-sm-extra"}>
                    <div className={"flex flex-col gap-xxs"}>
                        <Checkbox
                            id={EDITOR_ID}
                            label={WORKFLOWS_ACCESS_COPY.editorLabel}
                            checked={access.editor}
                            disabled={access.locked}
                            onChange={changeEditor}
                            aria-describedby={EDITOR_DESCRIPTION_ID}
                        />
                        <Text
                            as={"div"}
                            id={EDITOR_DESCRIPTION_ID}
                            size={"sm"}
                            className={"pl-lg text-neutral-strong"}
                        >
                            {WORKFLOWS_ACCESS_COPY.editorDescription}
                        </Text>
                    </div>
                    <div className={"flex flex-col gap-xxs"}>
                        <Checkbox
                            id={REASSIGN_ID}
                            label={WORKFLOWS_ACCESS_COPY.reassignLabel}
                            checked={access.reassign}
                            disabled={access.locked}
                            onChange={changeReassign}
                            aria-describedby={REASSIGN_DESCRIPTION_ID}
                        />
                        <Text
                            as={"div"}
                            id={REASSIGN_DESCRIPTION_ID}
                            size={"sm"}
                            className={"pl-lg text-neutral-strong"}
                        >
                            {WORKFLOWS_ACCESS_COPY.reassignDescription}
                        </Text>
                    </div>
                </div>
            )}
            {note !== null && (
                <Text as={"div"} size={"sm"} className={"text-neutral-strong"}>
                    {note}
                </Text>
            )}
            <div
                className={
                    "flex items-start gap-sm rounded-md bg-neutral-subtle px-sm-extra py-sm-plus"
                }
            >
                <Icon icon={<InfoIcon />} label={""} size={"sm"} color={"neutral-light"} />
                <Text as={"div"} size={"sm"} className={"text-neutral-strong"}>
                    {WORKFLOWS_ACCESS_COPY.reviewingNote}
                </Text>
            </div>
        </div>
    );
};
