import React from "react";
import { Button } from "@webiny/admin-ui";
import { Heading } from "@webiny/admin-ui";
import { List } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { ReactComponent as OpenInNewIcon } from "@webiny/icons/open_in_new.svg";
import type { ReviewAttemptVm } from "../abstractions.js";
import type { AttemptOutcomeTone } from "../AttemptOutcomeTone.js";
import type { TargetReviewTagVariant } from "../../targetReview/abstractions.js";

const OUTCOME_VARIANTS: Record<AttemptOutcomeTone, TargetReviewTagVariant> = {
    failed: "destructive",
    approved: "success-light",
    running: "accent-light"
};

export interface ReviewStepAttemptsProps {
    attempts: ReviewAttemptVm[];
    onOpenTask(taskId: string): void;
}

// The attempts of an AI or automation step, oldest first, each with its outcome and task link.
export const ReviewStepAttempts = (props: ReviewStepAttemptsProps) => {
    return (
        <div data-role={"attempts"} className={"flex flex-col gap-xs"}>
            <Heading level={6}>{"Attempts"}</Heading>
            <List>
                {props.attempts.map(attempt => {
                    const taskId = attempt.taskId;
                    let actions: React.ReactNode = undefined;
                    if (attempt.showTaskLink && taskId !== null) {
                        actions = (
                            <Button
                                variant={"link"}
                                size={"sm"}
                                text={"Background task"}
                                icon={<OpenInNewIcon />}
                                iconPosition={"end"}
                                onClick={() => props.onOpenTask(taskId)}
                            />
                        );
                    }
                    return (
                        <List.Item
                            key={attempt.number}
                            icon={
                                <Tag
                                    variant={OUTCOME_VARIANTS[attempt.outcomeTone]}
                                    content={attempt.outcome}
                                />
                            }
                            title={
                                <>
                                    <span>{attempt.numberText}</span> <span>{attempt.span}</span>
                                </>
                            }
                            description={attempt.reason ?? undefined}
                            actions={actions}
                        />
                    );
                })}
            </List>
        </div>
    );
};
