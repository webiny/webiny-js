import type { Dispatch, SetStateAction } from "react";
import cloneDeep from "lodash/cloneDeep";
import findIndex from "lodash/findIndex";

import { mdbid } from "@webiny/utils";

import { FbFormStep, FbFormModel, FbFormModelField } from "~/types";

interface Props {
    step: FbFormStep;
    formData: FbFormModel;
    setRules: Dispatch<SetStateAction<FbFormStep["rules"]>>;
}

export const stepRulesHandlers = ({ step, formData, setRules }: Props) => {
    const addRule = () => {
        setRules(prevRules => {
            return [
                ...prevRules,
                {
                    title: "Rule",
                    id: mdbid(),
                    conditions: [],
                    action: "",
                    isValid: true,
                    chain: "matchAny"
                }
            ];
        });
    };

    const deleteRule = (ruleId: string) => {
        setRules(prevRules => prevRules.filter(rule => rule.id !== ruleId));
    };

    const updateRuleActions = (ruleIndex: number, actionValue: string) => {
        setRules(prevRules => {
            const copiedRules = cloneDeep(prevRules);
            copiedRules[ruleIndex] = {
                ...copiedRules[ruleIndex],
                action: actionValue
            };

            return copiedRules;
        });
    };

    const updateRuleChainOption = (ruleIndex: number, chainValue: string) => {
        setRules(prevRules => {
            const copiedRules = cloneDeep(prevRules);
            copiedRules[ruleIndex] = {
                ...copiedRules[ruleIndex],
                chain: chainValue
            };

            return copiedRules;
        });
    };

    const addCondition = (ruleId: string) => {
        setRules(prevRules => {
            prevRules
                .find(rule => rule.id === ruleId)
                ?.conditions.push({
                    fieldName: "",
                    filterType: "",
                    filterValue: "",
                    id: mdbid()
                });

            return [...prevRules];
        });
    };

    const deleteCondition = (ruleId: string, conditionId: string) => {
        setRules(prevRules => {
            // Rename
            const updatedRuleConditions = {
                ...prevRules.find(rule => rule.id === ruleId),
                conditions: prevRules
                    .find(rule => rule.id === ruleId)
                    ?.conditions.filter(condition => condition.id !== conditionId)
            };
            return [
                ...prevRules.filter(rule => rule.id !== ruleId),
                updatedRuleConditions
            ] as FbFormStep["rules"];
        });
    };

    const getFieldById = (id: string): FbFormModelField | null => {
        return formData.fields.find(field => field._id === id) || null;
    };

    const getFields = () => {
        // Checking if the step for which we adding rules is first in array of steps,
        // if yes than we will only display it's own fields in condition field select,
        // if not, than we will also display fields from previous step. (line #111)
        const indexOfTheCurrentStep = findIndex(formData.steps, { id: step.id });
        if (step.layout) {
            const layout =
                indexOfTheCurrentStep === 0
                    ? step.layout
                    : [...step.layout, ...formData.steps[indexOfTheCurrentStep - 1].layout];

            return layout
                .map(row => {
                    return row.map(id => {
                        const field = getFieldById(id);

                        return field;
                    });
                })
                .flat(1);
        }
        return [];
    };

    return {
        addRule,
        deleteRule,
        updateRuleActions,
        updateRuleChainOption,
        addCondition,
        deleteCondition,
        getFields
    };
};
