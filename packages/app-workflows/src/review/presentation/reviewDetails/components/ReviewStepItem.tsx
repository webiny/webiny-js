import React from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";
import { Accordion } from "@webiny/admin-ui";
import { Alert } from "@webiny/admin-ui";
import { Heading } from "@webiny/admin-ui";
import { List } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as RunningIcon } from "@webiny/icons/progress_activity.svg";
import type { ReviewDetailsStepVm } from "../abstractions.js";
import { ReviewStepAttempts } from "./ReviewStepAttempts.js";
import { ReviewStepCircle } from "./ReviewStepCircle.js";

export interface ReviewStepItemProps {
    step: ReviewDetailsStepVm;
    onOpenTask(stepId: string, taskId: string): void;
}

/*
 * One step of the review as an accordion item: the state icon, title, type and state tags in the
 * header; owner, times, comment, failure, issues and attempts in the body. The item is open by
 * default when the view model says so, and opens again when a refresh makes it the one to read.
 * Must render inside an `Accordion`.
 */
export const ReviewStepItem = (props: ReviewStepItemProps) => {
    const { step } = props;
    const [open, setOpen] = useState(step.expanded);
    const wasExpandedRef = useRef(step.expanded);
    useEffect(() => {
        if (step.expanded && !wasExpandedRef.current) {
            setOpen(true);
        }
        wasExpandedRef.current = step.expanded;
    }, [step.expanded]);

    const title = (
        <span className={"flex flex-wrap items-center gap-xs min-w-0"}>
            <Text as={"span"} size={"md"}>
                {step.title}
            </Text>
            <Tag variant={"neutral-base-outline"} content={step.typeLabel} />
            <Tag
                variant={step.stateVariant}
                content={step.stateLabel}
                icon={step.running ? <RunningIcon /> : undefined}
            />
        </span>
    );

    let ownerRows: React.ReactNode = null;
    if (step.ownerLine !== null) {
        ownerRows = (
            <List>
                <List.Item title={"Owner"} description={step.ownerLine} />
                {step.whyOwner !== null && (
                    <List.Item title={"Why this owner"} description={step.whyOwner} />
                )}
                {step.times !== null && (
                    <List.Item
                        title={"Times"}
                        description={<span title={step.timesTitle ?? undefined}>{step.times}</span>}
                    />
                )}
            </List>
        );
    }

    const hasDetails =
        step.ownerLine !== null ||
        step.comment !== null ||
        step.failedReason !== null ||
        step.issues.length > 0 ||
        step.attempts.length > 0 ||
        step.skipped !== null;

    return (
        <div data-testid={`review-step-${step.stepId}`}>
            <Accordion.Item
                title={title}
                colorMark={step.color}
                icon={<ReviewStepCircle state={step.state} running={step.running} />}
                open={open}
                onOpenChange={setOpen}
                interactive={hasDetails}
            >
                <div className={"flex flex-col gap-sm pb-md"}>
                    {ownerRows}
                    {step.comment !== null && (
                        <div data-role={"step-comment"} className={"px-md"}>
                            <Text as={"div"} size={"md"}>
                                {step.comment}
                            </Text>
                        </div>
                    )}
                    {step.failedReason !== null && (
                        <Alert data-role={"failed-reason"} type={"danger"} variant={"subtle"}>
                            <Text as={"span"}>{step.failedReason}</Text>
                        </Alert>
                    )}
                    {step.issues.length > 0 && (
                        <div data-role={"issues"} className={"flex flex-col gap-xs"}>
                            <div className={"px-md"}>
                                <Heading level={6}>{"Issues reported by the AI"}</Heading>
                            </div>
                            <List>
                                {step.issues.map((issue, issueIndex) => (
                                    <List.Item
                                        key={issueIndex}
                                        title={
                                            <span
                                                data-role={"issue-title"}
                                                className={"flex items-center gap-xs"}
                                            >
                                                <span>{issue.field}</span>
                                                <Tag
                                                    variant={issue.severityVariant}
                                                    content={issue.severityLabel}
                                                />
                                            </span>
                                        }
                                        description={
                                            <>
                                                <div>{issue.message}</div>
                                                <div>{issue.suggestion}</div>
                                            </>
                                        }
                                    />
                                ))}
                            </List>
                        </div>
                    )}
                    {step.attempts.length > 0 && (
                        <ReviewStepAttempts
                            attempts={step.attempts}
                            onOpenTask={taskId => props.onOpenTask(step.stepId, taskId)}
                        />
                    )}
                    {step.skipped !== null && (
                        <div className={"flex flex-col gap-xs"}>
                            <div className={"px-md"}>
                                <Heading level={6}>{"Skipped by assignment"}</Heading>
                            </div>
                            <List>
                                {step.skipped.map(item => (
                                    <List.Item
                                        key={item.id}
                                        title={item.name}
                                        description={item.reason}
                                    />
                                ))}
                            </List>
                        </div>
                    )}
                </div>
            </Accordion.Item>
        </div>
    );
};
