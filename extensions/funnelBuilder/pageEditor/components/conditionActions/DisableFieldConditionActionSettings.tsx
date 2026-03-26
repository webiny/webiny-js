import React from "react";
import { Bind } from "webiny/admin/form";
import { Select } from "webiny/admin/ui";
import type { ConditionActionSettingsProps } from "./index";

export const DisableFieldConditionActionSettings = ({ funnel }: ConditionActionSettingsProps) => {
    return (
        <Bind name={"extra.targetFieldId"}>
            <Select
                displayResetAction={false}
                placeholder={"Select target field..."}
                size={"md"}
                options={funnel.fields.map(field => ({
                    value: field.id ?? "",
                    label: field.label ?? ""
                }))}
            />
        </Bind>
    );
};
