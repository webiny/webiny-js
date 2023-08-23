import React, { Dispatch, SetStateAction } from "react";
import { Icon } from "@webiny/ui/Icon";
import { AccordionItem } from "@webiny/ui/Accordion";

import { ReactComponent as InfoIcon } from "@material-design-icons/svg/outlined/info.svg";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete_outline.svg";

import { RuleCondition } from "./RuleCondition";
import { RuleActionSelect } from "./RuleActionSelect";
import { conditionChainOptions } from "./fieldsValidationConditions";
import { stepRulesHandlers } from "./helpers";
import {
    RulesTabWrapper,
    AddRuleButtonWrapper,
    RuleButtonDescription,
    StyledAccordion,
    ConditionSetupWrapper,
    AddRuleButton,
    AddConditionButton,
    ConditionsChainSelect
} from "../../Styled";

import { FbFormStep, FbFormModel } from "~/types";
interface RulesTabProps {
    step: FbFormStep;
    rules: FbFormStep["rules"];
    formData: FbFormModel;
    setRules: Dispatch<SetStateAction<FbFormStep["rules"]>>;
}

export const RulesTab = ({ step, rules, formData, setRules }: RulesTabProps) => {
    const {
        addRule,
        deleteRule,
        updateRuleActions,
        updateRuleChainOption,
        addCondition,
        deleteCondition,
        getFields
    } = stepRulesHandlers({ step, formData, setRules });

    const fields = getFields();
    // We should not be able to add rules for the last step in the form.
    // But in case user has added rules for the step and then moved step to the bottom,
    // then we should disable ability to add new rules, conditions and we should mark step,
    // as step with broken rules, so the use would not be able to publish broken form,
    // until he deletes rules from the form or moves step back.
    const isCurrentStepLast =
        formData.steps.findIndex(steps => steps.id === step.id) === formData.steps.length - 1;
    const rulesDisabledMessage = "You cannot add rules to the last step!";

    // We also check whether last step has rules,
    // if yes then we most block ability to add new rules and conditions.
    if (isCurrentStepLast && !step.rules.length) {
        return (
            <RulesTabWrapper>
                <h4>{rulesDisabledMessage}</h4>
            </RulesTabWrapper>
        );
    }

    return (
        <RulesTabWrapper>
            {rules &&
                rules.map((rule, ruleIndex) => (
                    <StyledAccordion key={rule.id}>
                        <AccordionItem
                            open={true}
                            title={rule.title}
                            actions={
                                <AccordionItem.Actions>
                                    <AccordionItem.Action
                                        icon={<DeleteIcon />}
                                        onClick={() => deleteRule(rule.id)}
                                    />
                                </AccordionItem.Actions>
                            }
                        >
                            {rule.conditions.length === 0 ? (
                                <AddConditionButton
                                    onClick={() => addCondition(rule.id)}
                                    disabled={isCurrentStepLast}
                                >
                                    + Add Condition
                                </AddConditionButton>
                            ) : (
                                <>
                                    {rule.conditions.map((condition: any, index) => {
                                        return (
                                            <ConditionSetupWrapper key={condition.id}>
                                                <RuleCondition
                                                    rule={rule}
                                                    condition={condition}
                                                    fields={fields}
                                                    deleteCondition={deleteCondition}
                                                    setRules={setRules}
                                                    conditionIndex={index}
                                                />
                                                {condition.id ===
                                                    rule.conditions[rule.conditions.length - 1]
                                                        .id && (
                                                    <>
                                                        <AddConditionButton
                                                            onClick={() => addCondition(rule.id)}
                                                            disabled={isCurrentStepLast}
                                                        >
                                                            + Add Condition
                                                        </AddConditionButton>
                                                        <ConditionsChainSelect
                                                            label="Select Conditions Chain Option"
                                                            placeholder="Select Conditions Chain Option"
                                                            value={rule.chain}
                                                            onChange={val =>
                                                                updateRuleChainOption(
                                                                    ruleIndex,
                                                                    val
                                                                )
                                                            }
                                                        >
                                                            {conditionChainOptions.map(
                                                                chainOption => (
                                                                    <option
                                                                        key={`${chainOption.label}-${chainOption.value}`}
                                                                        value={chainOption.value}
                                                                    >
                                                                        {chainOption.label}
                                                                    </option>
                                                                )
                                                            )}
                                                        </ConditionsChainSelect>
                                                        <RuleActionSelect
                                                            updateRuleActions={updateRuleActions}
                                                            rule={rule}
                                                            steps={formData.steps}
                                                            currentStep={step}
                                                            ruleIndex={ruleIndex}
                                                        />
                                                    </>
                                                )}
                                            </ConditionSetupWrapper>
                                        );
                                    })}
                                </>
                            )}
                        </AccordionItem>
                    </StyledAccordion>
                ))}
            <AddRuleButtonWrapper>
                <AddRuleButton onClick={addRule} disabled={isCurrentStepLast}>
                    + Add Rule
                </AddRuleButton>
                <RuleButtonDescription>
                    <Icon icon={<InfoIcon width={14} height={14} />} />
                    <span>Click here to learn how step rules work</span>
                </RuleButtonDescription>
            </AddRuleButtonWrapper>
        </RulesTabWrapper>
    );
};
