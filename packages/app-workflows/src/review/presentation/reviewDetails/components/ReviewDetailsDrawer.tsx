import React from "react";
import { useEffect } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { Alert } from "@webiny/admin-ui";
import { Button } from "@webiny/admin-ui";
import { Drawer } from "@webiny/admin-ui";
import { Skeleton } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as OpenInNewIcon } from "@webiny/icons/open_in_new.svg";
import { ReviewActionDialogs } from "../../actionDialog/components/ReviewActionDialogs.js";
import { toActionRequest } from "../../actionDialog/toActionRequest.js";
import { REVIEW_ACTION_ICONS } from "../../targetReview/components/reviewBarAppearance.js";
import { REVIEW_TAG_ICONS } from "../../targetReview/components/reviewBarAppearance.js";
import { ReviewDetailsPresenterFeature } from "../feature.js";
import type { ReviewDetailsPresenter } from "../abstractions.js";
import { ReviewStepRunPanel } from "./ReviewStepRunPanel.js";

const RunningIcon = REVIEW_TAG_ICONS.progress_activity;

export interface ReviewDetailsDrawerProps {
    // The review's namespace; the drawer and its nested dialogs run on it (R353, R363).
    namespace: string;
    reviewId: string;
    reviewsUrl: string | null;
    onClose: () => void;
    onChanged?: () => void;
}

interface ReviewDetailsDrawerViewProps {
    presenter: ReviewDetailsPresenter.Interface;
    namespace: string;
    reviewsUrl: string | null;
    onClose: () => void;
    onChanged?: () => void;
}

const ReviewDetailsDrawerView = createReactiveComponent(function ReviewDetailsDrawerView(
    props: ReviewDetailsDrawerViewProps
) {
    const { presenter, namespace, reviewsUrl, onClose, onChanged } = props;
    const { vm } = presenter;
    const request = toActionRequest(vm.openAction, vm.reviewId);

    const footer = vm.actions.map(action => {
        const ActionIcon = REVIEW_ACTION_ICONS[action.icon];
        return (
            <Button
                key={action.kind}
                variant={action.emphasis}
                size={"md"}
                text={action.label}
                icon={<ActionIcon />}
                onClick={() => presenter.openAction(action.kind, action.stepId)}
            />
        );
    });

    // A conflict means the review changed behind the drawer: reload it and tell the host.
    const handleConflict = async () => {
        await presenter.refresh();
        if (onChanged) {
            onChanged();
        }
    };

    let actions: React.ReactNode = undefined;
    if (footer.length > 0) {
        actions = <>{footer}</>;
    }

    return (
        <>
            <Drawer
                open={true}
                size={"lg"}
                title={"Review details"}
                onClose={onClose}
                actions={actions}
            >
                <div className={"flex flex-col gap-md p-md"}>
                    {vm.status === "loading" && (
                        <div className={"flex flex-col gap-md"}>
                            <Text size={"lg"} className={"font-semibold"}>
                                {"Loading review…"}
                            </Text>
                            <Skeleton type={"text"} size={"xl"} />
                            <Skeleton type={"text"} size={"xl"} />
                            <Skeleton type={"text"} size={"xl"} />
                        </div>
                    )}
                    {vm.status === "failed" && (
                        <div className={"flex flex-col items-center gap-sm text-center"}>
                            <Text size={"lg"} className={"font-semibold"}>
                                {"Could not load review details"}
                            </Text>
                            <Text size={"md"}>{vm.error}</Text>
                            <Button
                                variant={"tertiary"}
                                text={"Try again"}
                                onClick={() => presenter.refresh()}
                            />
                        </div>
                    )}
                    {vm.header !== null && (
                        <div className={"flex flex-col gap-xs"}>
                            <div className={"flex flex-wrap items-center gap-sm"}>
                                <Text size={"lg"} className={"font-semibold"}>
                                    {vm.header.title}
                                </Text>
                                <Tag
                                    variant={vm.header.stateVariant}
                                    content={vm.header.stateLabel}
                                />
                            </div>
                            <div
                                className={
                                    "flex flex-wrap gap-x-md gap-y-xs text-sm text-neutral-strong"
                                }
                            >
                                <span>{vm.header.contentLine}</span>
                                <span>{vm.header.requesterLine}</span>
                                <span title={vm.header.requestedTitle}>
                                    {vm.header.requestedLine}
                                </span>
                            </div>
                        </div>
                    )}
                    {vm.cancelledText !== null && (
                        <Alert type={"info"} variant={"subtle"}>
                            <div className={"font-semibold"}>{"This review was cancelled"}</div>
                            <div>{vm.cancelledText}</div>
                        </Alert>
                    )}
                    {vm.steps.map(step => (
                        <div
                            key={step.stepId}
                            className={
                                "flex flex-col gap-sm border-b-sm border-neutral-dimmed pb-md"
                            }
                        >
                            <div className={"flex flex-wrap items-center gap-sm"}>
                                <span
                                    className={"h-[8px] w-[8px] rounded-full"}
                                    style={{ backgroundColor: step.color }}
                                />
                                <Text size={"md"} className={"font-semibold"}>
                                    {step.title}
                                </Text>
                                <Tag variant={"neutral-base-outline"} content={step.typeLabel} />
                                <Tag
                                    variant={step.stateVariant}
                                    content={step.stateLabel}
                                    icon={step.running ? <RunningIcon /> : undefined}
                                />
                            </div>
                            {step.ownerLine !== null && (
                                <div
                                    className={
                                        "grid grid-cols-[120px_1fr] gap-x-md gap-y-xs text-sm"
                                    }
                                >
                                    <span className={"text-neutral-muted"}>{"Owner"}</span>
                                    <span>{step.ownerLine}</span>
                                    {step.whyOwner !== null && (
                                        <>
                                            <span className={"text-neutral-muted"}>
                                                {"Why this owner"}
                                            </span>
                                            <span>{step.whyOwner}</span>
                                        </>
                                    )}
                                    {step.times !== null && (
                                        <>
                                            <span className={"text-neutral-muted"}>{"Times"}</span>
                                            <span title={step.timesTitle ?? undefined}>
                                                {step.times}
                                            </span>
                                        </>
                                    )}
                                </div>
                            )}
                            {step.comment !== null && (
                                <div className={"rounded-md bg-neutral-light p-sm text-sm"}>
                                    {step.comment}
                                </div>
                            )}
                            {step.failedReason !== null && (
                                <div
                                    data-role={"failed-reason"}
                                    className={
                                        "rounded-md border-sm border-destructive-default p-sm text-sm"
                                    }
                                >
                                    {step.failedReason}
                                </div>
                            )}
                            {step.attempts.length > 0 && (
                                <div
                                    data-role={"attempts"}
                                    className={"flex flex-col gap-xs text-sm"}
                                >
                                    <div
                                        className={
                                            "text-xs font-semibold uppercase text-neutral-muted"
                                        }
                                    >
                                        {"Attempts"}
                                    </div>
                                    {step.attempts.map(attempt => {
                                        const taskId = attempt.taskId;
                                        return (
                                            <div
                                                key={attempt.number}
                                                className={"flex flex-wrap items-center gap-sm"}
                                            >
                                                <span>{attempt.text}</span>
                                                {attempt.showTaskLink && taskId !== null && (
                                                    <Button
                                                        variant={"ghost"}
                                                        size={"sm"}
                                                        text={"Background task"}
                                                        icon={<OpenInNewIcon />}
                                                        onClick={() =>
                                                            presenter.openStepRun(
                                                                step.stepId,
                                                                taskId
                                                            )
                                                        }
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {step.issues.length > 0 && (
                                <div
                                    data-role={"issues"}
                                    className={"flex flex-col gap-xs text-sm"}
                                >
                                    <div
                                        className={
                                            "text-xs font-semibold uppercase text-neutral-muted"
                                        }
                                    >
                                        {"Issues reported by the AI"}
                                    </div>
                                    {step.issues.map((issue, index) => (
                                        <div
                                            key={index}
                                            className={
                                                "flex flex-col gap-xs rounded-md border-sm border-neutral-dimmed p-sm"
                                            }
                                        >
                                            <div className={"flex flex-wrap items-center gap-sm"}>
                                                <Tag
                                                    variant={issue.severityVariant}
                                                    content={issue.severityLabel}
                                                />
                                                <span className={"font-medium"}>{issue.field}</span>
                                            </div>
                                            <div>{issue.message}</div>
                                            <div className={"text-neutral-strong"}>
                                                {issue.suggestion}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {step.skipped !== null && (
                                <div
                                    className={
                                        "rounded-md border-sm border-dashed border-neutral-muted p-sm text-sm"
                                    }
                                >
                                    <div
                                        className={
                                            "text-xs font-semibold uppercase text-neutral-muted"
                                        }
                                    >
                                        {"Skipped by assignment"}
                                    </div>
                                    {step.skipped.map(item => (
                                        <div key={item.id}>
                                            <b className={"font-medium"}>{item.name}</b>
                                            {`: ${item.reason}`}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Drawer>
            <ReviewActionDialogs
                namespace={namespace}
                request={request}
                reviewsUrl={reviewsUrl}
                onConflict={handleConflict}
                onDone={() => presenter.actionDone()}
                onClose={() => presenter.closeAction()}
            />
            <ReviewStepRunPanel presenter={presenter} />
        </>
    );
});

// One presenter per mounted drawer (transient, R212): init on mount, dispose on unmount.
export const ReviewDetailsDrawer = (props: ReviewDetailsDrawerProps) => {
    const { namespace, reviewId, reviewsUrl, onClose, onChanged } = props;
    const { presenter } = useFeature(ReviewDetailsPresenterFeature);

    useEffect(() => {
        presenter.init({ namespace, reviewId, reviewsUrl, onClose, onChanged });
        return () => presenter.dispose();
    }, [presenter, reviewId]);

    return (
        <ReviewDetailsDrawerView
            presenter={presenter}
            namespace={namespace}
            reviewsUrl={reviewsUrl}
            onClose={onClose}
            onChanged={onChanged}
        />
    );
};
