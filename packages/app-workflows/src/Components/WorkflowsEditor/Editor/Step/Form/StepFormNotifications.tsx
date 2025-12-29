import React, { useMemo } from "react";
import { Bind } from "@webiny/form";
import { validation } from "@webiny/validation";
import { CheckboxGroup } from "@webiny/admin-ui";
import type { IWorkflowNotificationType, IWorkflowStepNotification } from "~/types.js";

const convertInputValue = (value?: IWorkflowStepNotification[]): string[] => {
    if (!value?.length) {
        return [];
    }
    return value.map(v => v.id);
};

interface IStepFormNotificationsProps {
    items: IWorkflowNotificationType[];
}

export const StepFormNotifications = (props: IStepFormNotificationsProps) => {
    const { items: initialItems } = props;

    const items = useMemo(() => {
        return initialItems.map(item => {
            return {
                id: item.id,
                value: item.id,
                label: item.title
            };
        });
    }, [initialItems]);
    return (
        <Bind name={"notifications"} validators={validation.create("required")}>
            {({ value, onChange }) => {
                return (
                    <CheckboxGroup
                        label={"Notifications"}
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
