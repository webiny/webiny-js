import React from "react";
import { FormComponentErrorMessage } from "@webiny/admin-ui";
import { FormComponentLabel } from "@webiny/admin-ui";
import { RadioGroup } from "@webiny/admin-ui";
import type { RadioGroupPrimitiveProps } from "@webiny/admin-ui";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { ASSIGNMENT_STRATEGY_CARDS } from "../assignmentStrategyCards.js";
import { StrategyCardLabel } from "./assignmentStrategy/StrategyCardLabel.js";
import "../stepFormRendererNames.js";

const LABEL_ID = "assignment-strategy-label";
const ITEM_ID_PREFIX = "assignment-strategy";

/*
 * Strategy (R297, R305, D21): three radio cards over the stock `RadioGroup`, whose item labels are
 * the cards. The field value is the stored strategy; a stored value the editor does not know is
 * `null` and selects no card (R314). The group is named by the visible label.
 */
export const AssignmentStrategyRenderer = createFieldRenderer<"workflowAssignmentStrategy">(
    ({ field }) => {
        const value = typeof field.value === "string" ? field.value : "";
        const invalid = field.validation.isValid === false;

        const items: RadioGroupPrimitiveProps["items"] = [];
        for (const card of ASSIGNMENT_STRATEGY_CARDS) {
            items.push({
                id: `${ITEM_ID_PREFIX}-${card.value}`,
                value: card.value,
                label: <StrategyCardLabel card={card} />
            });
        }

        const handleChange = (strategy: string) => {
            field.onChange(strategy);
            field.onBlur();
        };

        return (
            <div className={"flex w-full flex-col gap-sm"}>
                <FormComponentLabel
                    id={LABEL_ID}
                    text={field.label}
                    disabled={field.disabled}
                    invalid={invalid}
                />
                <RadioGroup
                    aria-labelledby={LABEL_ID}
                    items={items}
                    value={value}
                    disabled={field.disabled}
                    onChange={handleChange}
                />
                <FormComponentErrorMessage
                    text={field.validation.message}
                    invalid={invalid}
                    disabled={field.disabled}
                />
            </div>
        );
    }
);
