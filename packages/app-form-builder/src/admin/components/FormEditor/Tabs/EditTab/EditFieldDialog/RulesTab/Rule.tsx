import React from "react";

import { BindComponent } from "@webiny/form/types";

import { RuleConditions, AddCondition } from "../RulesConditions";
import { FbFormRule, FbFormModelField } from "~/types";
import { RuleActionSelect } from "../RuleActionSelect";

interface RuleProps {
    bind: BindComponent;
    rules: FbFormRule[];
    ruleIndex: number;
    fields: (FbFormModelField | null)[];
}

interface BindProps {
    value: FbFormRule;
    onChange: (params: FbFormRule) => void;
}

export const Rule = ({ ruleIndex, bind: Bind, fields, rules }: RuleProps) => {
    return (
        <Bind name={`settings.rules[${ruleIndex}]`}>
            {({ value: rule, onChange }: BindProps) => (
                <>
                    {!rule.conditions.length ? (
                        <AddCondition rule={rule} onChange={onChange} />
                    ) : (
                        <>
                            {rule.conditions.map((condition, conditionIndex) => (
                                <div key={condition.id}>
                                    <RuleConditions
                                        rule={rule}
                                        condition={condition}
                                        conditionIndex={conditionIndex}
                                        fields={fields}
                                        rules={rules}
                                        onChange={onChange}
                                    />
                                </div>
                            ))}
                            <RuleActionSelect rule={rule} onChange={onChange} />
                        </>
                    )}
                </>
            )}
        </Bind>
    );
};
