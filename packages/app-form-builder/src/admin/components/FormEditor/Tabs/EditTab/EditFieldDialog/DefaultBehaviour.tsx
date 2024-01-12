import React from "react";

import { AccordionItem } from "@webiny/ui/Accordion";
import { Select } from "@webiny/ui/Select";

import {
    AccordionWithShadow,
    DefaultBehaviourWrapper
} from "~/admin/components/FormEditor/Tabs/EditTab/Styled";

interface Props {
    defaultBehaviourValue: string;
    onChange: (params: string) => void;
}

const defaultBehaviour = [
    {
        label: "Show the fields in the conditional group",
        value: "show"
    },
    {
        label: "Hide the fields in the conditional group",
        value: "hide"
    }
];

export const SelectDefaultBehaviour: React.FC<Props> = ({ defaultBehaviourValue, onChange }) => {
    return (
        <AccordionWithShadow>
            <AccordionItem title="Default behaviour" open={true}>
                <DefaultBehaviourWrapper>
                    <span>By default if no rule is met</span>
                    <Select
                        label="Select default behaviour"
                        placeholder="Select default behaviour"
                        value={defaultBehaviourValue || "show"}
                        onChange={value => onChange(value)}
                    >
                        {defaultBehaviour.map(behaviour => (
                            <option key={`--${behaviour.value}--`} value={behaviour.value}>
                                {behaviour.label}
                            </option>
                        ))}
                    </Select>
                </DefaultBehaviourWrapper>
            </AccordionItem>
        </AccordionWithShadow>
    );
};
