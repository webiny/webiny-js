import React from "react";

import { Alert } from "@webiny/ui/Alert";
import { BindComponent, FormRenderPropParams } from "@webiny/form";

import { getAvailableFields } from "~/admin/components/FormEditor/Tabs/EditTab/FormStep/EditFormStepDialog/helpers";
import { useFormEditor } from "~/admin/components/FormEditor/Context";
import { RulesTabWrapper } from "~/admin/components/FormEditor/Tabs/EditTab/Styled";

import { SelectDefaultBehaviour } from "../DefaultBehaviour";

import { FbFormRule, FbFormModelField, FbFormModel } from "~/types";
import { Rules } from "./Rules";

interface GetConditionFieldParams {
    id: string;
    formData: FbFormModel;
}

const getConditionField = ({ id, formData }: GetConditionFieldParams) => {
    const availableFields: Array<FbFormModelField | null> = [];

    formData.steps.forEach(step => {
        const stepLayout = step.layout.flat(2);

        if (stepLayout.includes(id)) {
            const fields = getAvailableFields({ step, formData }).filter(
                field => field?.type !== "condition-group"
            );
            availableFields.push(...fields);
        }
    });

    return availableFields;
};

interface RuleBrokenAlertProps {
    field: FbFormModelField;
}

const RulesBrokenAlert = ({ field }: RuleBrokenAlertProps) => {
    const rulesBroken = field?.settings?.rules?.some((rule: FbFormRule) => rule.isValid === false);

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

interface ConditionGroupDefaultBehaviorProps {
    bind: BindComponent;
}

const ConditionGroupDefaultBehavior = ({ bind: Bind }: ConditionGroupDefaultBehaviorProps) => {
    return (
        <Bind name={"settings.defaultBehaviour"}>
            {({ value, onChange }) => (
                <SelectDefaultBehaviour defaultBehaviourValue={value} onChange={onChange} />
            )}
        </Bind>
    );
};

interface RulesTabProps {
    field: FbFormModelField;
    form: FormRenderPropParams;
}

export const RulesTab = ({ field, form }: RulesTabProps) => {
    const { Bind } = form;

    const { data: formData } = useFormEditor();
    const fields = field._id ? getConditionField({ id: field._id, formData }) : [];

    return (
        <RulesTabWrapper>
            <RulesBrokenAlert field={field} />
            <ConditionGroupDefaultBehavior bind={Bind} />
            <Rules fields={fields} bind={Bind} />
        </RulesTabWrapper>
    );
};
