import React from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";
import { Button } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { FormModel } from "@webiny/app-admin";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { addRule } from "~/editor/model/rules/addRule.js";
import { clearFolderCondition } from "~/editor/model/rules/clearFolderCondition.js";
import { createRule } from "~/editor/model/rules/createRule.js";
import { moveRule } from "~/editor/model/rules/moveRule.js";
import { removeRule } from "~/editor/model/rules/removeRule.js";
import type { RulePatch } from "~/editor/model/rules/RulePatch.js";
import { updateRule } from "~/editor/model/rules/updateRule.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import { ASSIGNMENT_FORM_MESSAGES } from "../../assignmentFormMessages.js";
import { useStepFormOptions } from "../../useStepFormOptions.js";
import { readRules } from "./readRules.js";
import type { RuleMoveRequest } from "./RuleMoveRequest.js";
import { RuleCard } from "./RuleCard.js";
import { RulesEmptyNote } from "./RulesEmptyNote.js";

const TITLE_ID = "assignment-rules-title";

export interface RoutingRulesListProps {
    field: FormModel.FieldVM;
}

/*
 * The routing rule list (design 4.2, R294, R296, R313): the header, the empty note and one card
 * per rule. The rules are the form field's value; every command writes a new list through the
 * Task 10 helpers, so ids stay stable and nothing the editor does not edit is lost. The only
 * state is the live region's text, a visual one, and a ref for the pending keyboard move.
 */
export const RoutingRulesList = ({ field }: RoutingRulesListProps) => {
    const options = useStepFormOptions();
    const rules = readRules(field.value);
    const readOnly = field.disabled;
    const rootRef = useRef<HTMLDivElement>(null);
    const moveRequestRef = useRef<RuleMoveRequest | null>(null);
    const announceTimerRef = useRef<number | null>(null);
    const [announcement, setAnnouncement] = useState("");
    const orderKey = rules.map(rule => rule.id).join("|");

    // After a keyboard move: announce the new position and keep focus on the moved card's button.
    useEffect(() => {
        const request = moveRequestRef.current;
        const root = rootRef.current;
        if (request === null || root === null) {
            return;
        }
        const index = rules.findIndex(rule => rule.id === request.ruleId);
        if (index === -1) {
            return;
        }
        moveRequestRef.current = null;
        const moved = ASSIGNMENT_FORM_MESSAGES.ruleMoved(index + 1, rules.length);
        // The same text twice is no change to a screen reader: clear it, then set it on the next tick.
        setAnnouncement("");
        if (announceTimerRef.current !== null) {
            window.clearTimeout(announceTimerRef.current);
        }
        announceTimerRef.current = window.setTimeout(() => {
            announceTimerRef.current = null;
            setAnnouncement(moved);
        }, 0);

        // The pressed arrow, or the other one when the rule reached the first or last position.
        let label: string = ASSIGNMENT_FORM_MESSAGES.moveRuleDown;
        if (request.direction === "up") {
            label = ASSIGNMENT_FORM_MESSAGES.moveRuleUp;
        }
        const reachedFirst = request.direction === "up" && index === 0;
        const reachedLast = request.direction === "down" && index === rules.length - 1;
        if (reachedFirst) {
            label = ASSIGNMENT_FORM_MESSAGES.moveRuleDown;
        }
        if (reachedLast) {
            label = ASSIGNMENT_FORM_MESSAGES.moveRuleUp;
        }

        const cards = root.querySelectorAll("[data-rule-id]");
        for (const card of Array.from(cards)) {
            if (card.getAttribute("data-rule-id") === request.ruleId) {
                const button = card.querySelector<HTMLElement>(`[aria-label="${label}"]`);
                button?.focus();
                return;
            }
        }
    }, [orderKey]);

    // A timer that is still pending when the list goes away must not set state.
    useEffect(() => {
        return () => {
            if (announceTimerRef.current !== null) {
                window.clearTimeout(announceTimerRef.current);
            }
        };
    }, []);

    const commit = (next: RuleValue[]) => {
        field.onChange(next);
        field.onBlur();
    };

    const handleAdd = () => {
        const existingIds = rules.map(rule => rule.id);
        const rule = createRule(options.assignment.stepTeamIds, existingIds);
        const next = addRule(rules, rule);
        commit(next);
    };

    const handleMove = (index: number, direction: "up" | "down") => {
        let to = index + 1;
        if (direction === "up") {
            to = index - 1;
        }
        const next = moveRule(rules, index, to);
        // Nothing moves, or the field ignores the write: there is no move to announce or follow.
        if (next === rules || readOnly) {
            moveRequestRef.current = null;
            return;
        }
        moveRequestRef.current = { ruleId: rules[index].id, direction };
        commit(next);
    };

    const handleDelete = (ruleId: string) => {
        options.ruleErrors.clearRuleError(ruleId);
        const next = removeRule(rules, ruleId);
        commit(next);
    };

    const handleChange = (ruleId: string, patch: RulePatch) => {
        const next = updateRule(rules, ruleId, patch);
        commit(next);
    };

    const handleRemoveFolder = (ruleId: string) => {
        const next = rules.map(rule => (rule.id === ruleId ? clearFolderCondition(rule) : rule));
        commit(next);
    };

    return (
        <div
            ref={rootRef}
            role={"group"}
            aria-labelledby={TITLE_ID}
            className={"flex w-full flex-col gap-md border-t-sm border-neutral-subtle pt-md"}
        >
            <div role={"status"} aria-live={"polite"} className={"sr-only"}>
                {announcement}
            </div>
            <div className={"flex items-start justify-between gap-md"}>
                <div className={"flex flex-col"}>
                    <span id={TITLE_ID} className={"text-md font-semibold"}>
                        {ASSIGNMENT_FORM_MESSAGES.rulesLabel}
                    </span>
                    <Text as={"span"} size={"sm"} className={"text-neutral-strong"}>
                        {ASSIGNMENT_FORM_MESSAGES.rulesHint}
                    </Text>
                </div>
                <Button
                    variant={"tertiary"}
                    size={"sm"}
                    text={ASSIGNMENT_FORM_MESSAGES.addRule}
                    icon={<AddIcon />}
                    disabled={readOnly}
                    onClick={handleAdd}
                />
            </div>
            {rules.length === 0 && <RulesEmptyNote strategy={options.assignment.strategy} />}
            {rules.map((rule, index) => (
                <RuleCard
                    key={rule.id}
                    rule={rule}
                    index={index}
                    total={rules.length}
                    readOnly={readOnly}
                    options={options}
                    issues={options.ruleIssues.items.filter(issue => issue.ruleId === rule.id)}
                    errors={options.ruleErrors.items.filter(error => error.ruleId === rule.id)}
                    onChange={patch => handleChange(rule.id, patch)}
                    onRemoveFolder={() => handleRemoveFolder(rule.id)}
                    onMoveUp={() => handleMove(index, "up")}
                    onMoveDown={() => handleMove(index, "down")}
                    onDelete={() => handleDelete(rule.id)}
                />
            ))}
        </div>
    );
};
