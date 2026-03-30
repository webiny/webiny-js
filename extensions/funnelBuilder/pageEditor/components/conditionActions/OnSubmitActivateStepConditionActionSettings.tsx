import React from "react";
import { Bind } from "webiny/admin/form";
import { Select } from "webiny/admin/ui";
import type { ConditionActionSettingsProps } from "./index";

export const OnSubmitActivateStepConditionActionSettings = ({
    funnel
}: ConditionActionSettingsProps) => {
    const stepOptions = funnel.steps
        .filter(step => step.id !== "success")
        .map(step => ({ value: step.id, label: step.title }));

    return (
        <div className={"flex gap-sm"}>
            <Bind name={"extra.targetStepId"}>
                <Select placeholder={"Select target step..."} size={"md"} options={stepOptions} />
            </Bind>
            <Bind name={"extra.evaluationStep"}>
                <Select
                    displayResetAction={false}
                    placeholder={"Evaluate upon submitting step..."}
                    size={"md"}
                    options={stepOptions}
                />
            </Bind>
        </div>
    );
};
