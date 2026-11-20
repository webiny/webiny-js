import React from "react";
import { Switch } from "@webiny/admin-ui";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import "../stepFormRendererNames.js";

/*
 * Let the requester pick a reviewer (R296, D21): the switch leads and the hint is the switch's own
 * note.
 */
export const RequesterPickRenderer = createFieldRenderer<"workflowRequesterPick">(({ field }) => {
    return (
        <div className={"flex w-full flex-col"}>
            <Switch
                checked={!!field.value}
                onChange={value => field.onChange(value)}
                label={field.label}
                note={field.note}
                variant={"branded"}
                disabled={field.disabled}
                validation={field.validation}
            />
        </div>
    );
});
