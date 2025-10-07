import React from "react";
import { Bind } from "@webiny/form";
import { validation } from "@webiny/validation";
import type { CheckboxItemDto } from "@webiny/admin-ui";
import { CheckboxGroup } from "@webiny/admin-ui";
import type { IWorkflowStepNotification } from "~/types.js";

const items: CheckboxItemDto[] = [
    {
        id: "slack",
        value: "slack",
        label: "Slack"
    },
    {
        id: "email",
        value: "email",
        label: "Email"
    },
    {
        id: "sms",
        value: "sms",
        label: "SMS"
    }
];

const convertInputValue = (value?: IWorkflowStepNotification[]): string[] => {
    if (!value?.length) {
        return [];
    }
    return value.map(v => v.id);
};

export const StepFormNotifications = () => {
    return (
        <Bind name={"notifications"} validators={validation.create("required")}>
            {({ value, onChange }) => {
                return (
                    <CheckboxGroup
                        label={"Notifications"}
                        // TODO figure out how to add possible notifications
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
