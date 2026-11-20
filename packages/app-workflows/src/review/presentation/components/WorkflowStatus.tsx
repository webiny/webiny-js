import React from "react";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { TargetReviewTag } from "~/review/presentation/targetReview/abstractions.js";
import { REVIEW_TAG_ICONS } from "~/review/presentation/targetReview/components/reviewBarAppearance.js";

export interface WorkflowStatusProps {
    step: string | null;
    stepColor: string | null;
    state: TargetReviewTag | null;
    owner: string | null;
}

/*
 * Where a review is in its workflow: the step tag (with the step's colour, a fixed 100px width and
 * the name truncated) followed by the step state tag. The hover text names the step and its owner.
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
        let icon: React.ReactElement | undefined = undefined;
        if (state.icon) {
            const StateIcon = REVIEW_TAG_ICONS[state.icon];
            icon = <StateIcon />;
        }
        stateTag = <Tag variant={state.variant} content={state.label} icon={icon} />;
    }

    return (
        <div className="flex items-center gap-xs" title={title} data-role="workflow-status">
            {stepTag}
            {stateTag}
        </div>
    );
};
