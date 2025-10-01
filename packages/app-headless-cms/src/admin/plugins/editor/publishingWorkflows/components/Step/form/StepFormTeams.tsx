import React from "react";
import { Bind } from "@webiny/form";
import { validation } from "@webiny/validation";
import type { CheckboxItemDto } from "@webiny/admin-ui";
import { CheckboxGroup } from "@webiny/admin-ui";
import type { IWorkflowStepNotification } from "~/types.js";

const items: CheckboxItemDto[] = [
    {
        id: "blue",
        value: "blue",
        label: "Blue Team"
    },
    {
        id: "red",
        value: "red",
        label: "Red Team"
    },
    {
        id: "green",
        value: "green",
        label: "Green Team"
    }
];

const convertInputValue = (value?: IWorkflowStepNotification[]): string[] => {
    if (!value?.length) {
        return [];
    }
    return value.map(v => v.id);
};

export const StepFormTeams = () => {
    return (
        <Bind name={"teams"} validators={validation.create("required,minLength:1")}>
            {({ value, onChange }) => {
                return (
                    <CheckboxGroup
                        label={"Teams"}
                        // TODO figure out how to add possible teams
                        items={items}
                        value={convertInputValue(value)}
                        onChange={(input: string[]) => {
                            onChange(input.map(id => ({ id })));
                        }}
                    />
                );
            }}
        </Bind>
    );
};
