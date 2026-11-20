import React from "react";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { TargetReviewTag } from "~/review/presentation/targetReview/abstractions.js";

export interface WorkflowStatusProps {
    step: string | null;
    stepColor: string | null;
    state: TargetReviewTag | null;
    owner: string | null;
}

/*
 * Where a review is in its workflow: the step tag (with the step's colour, a fixed 100px width and
 * the name truncated) followed by the text-only step state tag (no icon; the review bar keeps the
 * icons). The hover text names the step and its owner.
 */
export const WorkflowStatus = ({ step, stepColor, state, owner }: WorkflowStatusProps) => {
    if (step === null && state === null) {
        return (
            <Text size="sm" className="text-neutral-strong">
                -
            </Text>
        );
    }

    let title: string | undefined = undefined;
    if (step !== null && owner !== null) {
        title = `${step} · ${owner}`;
    }

    let stepTag: React.ReactNode = null;
    if (step !== null) {
        let swatchColor: string | undefined = undefined;
        if (stepColor !== null) {
            swatchColor = stepColor;
        }
        stepTag = (
            <Tag
                variant="neutral-light"
                className="w-[100px] shrink-0"
                content={
                    <Text data-role="current-step-text" size="sm">
                        {step}
                    </Text>
                }
                swatchColor={swatchColor}
            />
        );
    }

    let stateTag: React.ReactNode = null;
    if (state !== null) {
        stateTag = <Tag variant={state.variant} content={state.label} />;
    }

    return (
        <div className="flex items-center gap-xs" title={title} data-role="workflow-status">
            {stepTag}
            {stateTag}
        </div>
    );
};
