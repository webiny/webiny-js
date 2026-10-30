import React from "react";
import { Card } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { ReactComponent as ArrowDownwardIcon } from "@webiny/icons/arrow_downward.svg";
import { ReactComponent as ArrowUpwardIcon } from "@webiny/icons/arrow_upward.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import { describeRule } from "~/editor/model/rules/describeRule.js";
import type { RuleIssue } from "~/editor/model/rules/RuleIssue.js";
import type { RulePatch } from "~/editor/model/rules/RulePatch.js";
import { ASSIGNMENT_FORM_MESSAGES } from "../../assignmentFormMessages.js";
import type { StepFormRuleError } from "../../StepFormOptions.js";
import { getRuleFieldMessages } from "./getRuleFieldMessages.js";
import type { RuleCardOptions } from "./RuleCardOptions.js";
import { RuleFields } from "./RuleFields.js";
import { RuleSummary } from "./RuleSummary.js";
import { RuleWarnings } from "./RuleWarnings.js";

export interface RuleCardProps {
    rule: RuleValue;
    // The position of the rule in the list, zero-based; the title is `Rule {index + 1}`.
    index: number;
    total: number;
    readOnly: boolean;
    options: RuleCardOptions;
    // The live issues of this rule (R299) and the server errors of this rule (R303).
    issues: RuleIssue[];
    errors: StepFormRuleError[];
    onChange(patch: RulePatch): void;
    onRemoveFolder(): void;
    onMoveUp(): void;
    onMoveDown(): void;
    onDelete(): void;
}

/*
 * One routing rule (design 4.2, R299, R303, R313): the header with the number and the move and
 * delete buttons, the readable summary, the five fields and the rule's warnings. The card is
 * controlled: it reports edits and never holds the rule. A rule's errors show under its fields.
 */
export const RuleCard = (props: RuleCardProps) => {
    const { rule, index, total, readOnly, options } = props;
    const messages = getRuleFieldMessages(props.issues, props.errors);
    const summary = describeRule(rule, options.references);
    const title = ASSIGNMENT_FORM_MESSAGES.ruleTitle(index + 1);

    const actions = (
        <div className={"flex items-center gap-xxs"}>
            <IconButton
                aria-label={ASSIGNMENT_FORM_MESSAGES.moveRuleUp}
                variant={"ghost"}
                size={"sm"}
                icon={<ArrowUpwardIcon />}
                disabled={readOnly || index === 0}
                onClick={props.onMoveUp}
            />
            <IconButton
                aria-label={ASSIGNMENT_FORM_MESSAGES.moveRuleDown}
                variant={"ghost"}
                size={"sm"}
                icon={<ArrowDownwardIcon />}
                disabled={readOnly || index === total - 1}
                onClick={props.onMoveDown}
            />
            <IconButton
                aria-label={ASSIGNMENT_FORM_MESSAGES.deleteRule}
                variant={"ghost"}
                size={"sm"}
                icon={<DeleteIcon />}
                disabled={readOnly}
                onClick={props.onDelete}
            />
        </div>
    );

    return (
        <div role={"group"} aria-label={title} data-rule-id={rule.id} className={"w-full"}>
            <Card title={title} actions={actions} padding={"sm"} size={"sm"}>
                <div className={"flex flex-col gap-md pb-md"}>
                    <RuleSummary text={summary} />
                    <RuleFields
                        rule={rule}
                        options={options}
                        messages={messages}
                        readOnly={readOnly}
                        onChange={props.onChange}
                        onRemoveFolder={props.onRemoveFolder}
                    />
                    <RuleWarnings warnings={messages.warnings} />
                </div>
            </Card>
        </div>
    );
};
