import React from "react";
import { Switch } from "@webiny/admin-ui";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import "../stepFormRendererNames.js";

/*
 * Let the requester pick a reviewer (R296, D21): label, then the hint as the switch's own
 * description, then the switch (design order).
 */
export const RequesterPickRenderer = createFieldRenderer<"workflowRequesterPick">(({ field }) => {
    return (
        <div className={"flex w-full flex-col"}>
            <Switch
                checked={!!field.value}
                onChange={value => field.onChange(value)}
                label={field.label}
                description={field.note}
                variant={"branded"}
                disabled={field.disabled}
                validation={field.validation}
            />
        </div>
    );
});
