import React from "react";
import { Separator } from "@webiny/admin-ui";
import { Switch } from "@webiny/admin-ui";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import "../stepFormRendererNames.js";

/*
 * Let the requester pick a reviewer (R296, D21): the switch leads and the hint is the switch's own
 * note. It follows the strategy cards, so it opens with the section divider.
 */
export const RequesterPickRenderer = createFieldRenderer<"workflowRequesterPick">(({ field }) => {
    return (
        <div className={"flex w-full flex-col"}>
            <Separator margin={"xl"} decorative={false} />
            <Switch
                checked={!!field.value}
                onChange={value => field.onChange(value)}
                label={field.label}
                note={field.note}
                labelPosition={"end"}
                disabled={field.disabled}
                validation={field.validation}
            />
        </div>
    );
});
