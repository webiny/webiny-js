import React from "react";
import { FormComponentErrorMessage } from "@webiny/admin-ui";
import { Switch } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import "../stepFormRendererNames.js";

/*
 * Let the requester pick a reviewer (R296, D21): the switch leads, its label is semibold and the
 * hint sits under the label, indented past the switch. It follows the strategy cards, so it
 * opens with the section divider.
 */
export const RequesterPickRenderer = createFieldRenderer<"workflowRequesterPick">(({ field }) => {
    const invalid = field.validation.isValid === false;

    return (
        <div className={"flex w-full flex-col gap-xs border-t-sm border-neutral-subtle pt-md"}>
            <Switch
                checked={!!field.value}
                onChange={value => field.onChange(value)}
                label={field.label}
                className={"[&_label]:font-semibold"}
                labelPosition={"end"}
                disabled={field.disabled}
            />
            <Text as={"span"} size={"sm"} className={"ml-[42px] text-neutral-strong"}>
                {field.note}
            </Text>
            <FormComponentErrorMessage
                text={field.validation.message}
                invalid={invalid}
                disabled={field.disabled}
            />
        </div>
    );
});
