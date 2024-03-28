import React from "react";
import { Alert } from "@webiny/ui/Alert";
import { getAvailableFields } from "../helpers";
import { RulesTabWrapper } from "~/admin/components/FormEditor/Tabs/EditTab/Styled";

import { FbFormStep, FbFormModel, FbFormRule } from "~/types";
import { BindComponent } from "@webiny/form/types";
import { Rules } from "./Rules";

interface RulesTabProps {
    bind: BindComponent;
    step: FbFormStep;
    formData: FbFormModel;
}

const RulesBrokenAlert = ({ rules }: { rules: FbFormRule[] }) => {
    const rulesBroken = rules.some(rule => rule.isValid === false);

    return rulesBroken !== undefined && rulesBroken === true ? (
        <Alert type="warning" title="Rules are broken">
            <span>
                At the moment one or more of your rules are broken. To correct the state please
                check your rules and ensure they are referencing fields that still exists and are
                place inside the current or one of the previous steps.
            </span>
        </Alert>
    ) : null;
};

export const RulesTab = ({ bind: Bind, step, formData }: RulesTabProps) => {
    const fields = getAvailableFields({ step, formData });

    const isCurrentStepLast =
        formData.steps.findIndex(steps => steps.id === step.id) === formData.steps.length - 1;

    const rulesDisabledMessage = "You cannot add rules to the last step!";

    // We also check whether last step has rules,
    // if yes then we most block ability to add new rules and conditions.
    if (isCurrentStepLast && !step?.rules?.length) {
        return (
            <RulesTabWrapper>
                <h4>{rulesDisabledMessage}</h4>
            </RulesTabWrapper>
        );
    }

    return (
        <RulesTabWrapper>
            <RulesBrokenAlert rules={step.rules} />
            <Rules bind={Bind} steps={formData.steps} currentStep={step} fields={fields} />
        </RulesTabWrapper>
    );
};
