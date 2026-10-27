import React from "react";
import { useEffect } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { EmptyState } from "@webiny/admin-ui";
import { Link } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { Button } from "@webiny/admin-ui";
import { Drawer } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as OpenInNewIcon } from "@webiny/icons/open_in_new.svg";
import { ReviewActionDialogs } from "../../actionDialog/components/ReviewActionDialogs.js";
import { toActionRequest } from "../../actionDialog/toActionRequest.js";
import { REVIEW_ACTION_ICONS } from "../../targetReview/components/reviewBarAppearance.js";
import { REVIEW_TAG_ICONS } from "../../targetReview/components/reviewBarAppearance.js";
import { ReviewDetailsPresenterFeature } from "../feature.js";
import type { ReviewDetailsPresenter } from "../abstractions.js";
import type { ReviewFieldLabels } from "../abstractions.js";
import { isToastInteraction } from "../isToastInteraction.js";
import type { AttemptOutcomeTone } from "../AttemptOutcomeTone.js";
import { ReviewStepRunPanel } from "./ReviewStepRunPanel.js";
import { ReviewStepCircle } from "./ReviewStepCircle.js";
import { ReviewDetailsSkeleton } from "./ReviewDetailsSkeleton.js";

const RunningIcon = REVIEW_TAG_ICONS.progress_activity;

const ATTEMPT_OUTCOME_CLASSES: Record<AttemptOutcomeTone, string> = {
    failed: "text-destructive-primary",
    approved: "text-success-primary",
    running: "text-accent-primary"
};

export interface ReviewDetailsDrawerProps {
    // The review's namespace; the drawer and its nested dialogs run on it (R353, R363).
    namespace: string;
    reviewId: string;
    reviewsUrl: string | null;
    onClose: () => void;
    onChanged?: () => void;
    // The content's field labels, for AI issues (RD5).
    fieldLabels?: ReviewFieldLabels;
    // The content type's label ("Article"), shown before the content title in the header.
    contentTypeLabel?: string | null;
    // Where the reviewed content opens; absent means the content link only closes the drawer.
    contentUrl?: string | null;
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
    const request = toActionRequest(vm.openAction);

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

    let title: React.ReactNode = "Review details";
    if (vm.status === "loading") {
        title = "Loading review…";
    }
    let description: React.ReactNode = undefined;
    if (vm.header !== null) {
        title = (
            <span className={"flex flex-col gap-xs"}>
                <span className={"text-xs font-normal text-neutral-muted"}>{"Review details"}</span>
                <span className={"flex flex-wrap items-center gap-sm"}>
                    <span className={"text-lg font-semibold"}>{vm.header.title}</span>
                    <Tag variant={vm.header.stateVariant} content={vm.header.stateLabel} />
                </span>
            </span>
        );
        if (vm.cancelledText === null) {
            let contentLink = (
                <Button
                    variant={"link"}
                    size={"sm"}
                    text={vm.header.contentLabel}
                    onClick={onClose}
                />
            );
            if (vm.header.contentUrl !== null) {
                contentLink = <Link to={vm.header.contentUrl}>{vm.header.contentLabel}</Link>;
            }
            description = (
                <span
                    className={
                        "flex flex-wrap items-center gap-x-md gap-y-xs text-sm text-neutral-strong"
                    }
                >
                    <span>
                        {"Content: "}
                        {contentLink}
                    </span>
                    <span>{vm.header.requesterLine}</span>
                    <span title={vm.header.requestedTitle}>{vm.header.requestedLine}</span>
                </span>
            );
        }
    }

    let openContent = <Button variant={"tertiary"} text={"Open content"} onClick={onClose} />;
    if (vm.header?.contentUrl) {
        openContent = (
            <Button variant={"tertiary"} asChild={true}>
                <Link to={vm.header.contentUrl}>{"Open content"}</Link>
            </Button>
        );
    }

    return (
        <>
            <Drawer
                open={true}
                modal={true}
                onInteractOutside={event => {
                    if (isToastInteraction(event.target)) {
                        event.preventDefault();
                    }
                }}
                headerSeparator={true}
                footerSeparator={true}
                size={"lg"}
                title={title}
                description={description}
                onClose={onClose}
                actions={actions}
            >
                <div className={"flex flex-col p-md"}>
                    {vm.status === "loading" && <ReviewDetailsSkeleton />}
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
                    {vm.cancelledText !== null && (
                        <EmptyState
                            type={"content"}
                            title={"This review was cancelled"}
                            description={vm.cancelledText}
                            actions={openContent}
                        />
                    )}
                    {vm.steps.map((step, index) => (
                        <div
                            key={step.stepId}
                            className={"grid grid-cols-[32px_minmax(0,1fr)] gap-md"}
                        >
                            <div className={"flex flex-col items-center"}>
                                <ReviewStepCircle state={step.state} running={step.running} />
                                {index < vm.steps.length - 1 && (
                                    <div
                                        data-role={"step-line"}
                                        className={"min-h-[16px] w-px flex-1 bg-neutral-muted"}
                                    />
                                )}
                            </div>
                            <div className={"flex min-w-0 flex-col gap-sm pb-md"}>
                                <div className={"flex flex-wrap items-center gap-sm pt-xs"}>
                                    <span
                                        className={"h-[8px] w-[8px] rounded-full"}
                                        style={{ backgroundColor: step.color }}
                                    />
                                    <Text size={"md"} className={"font-semibold"}>
                                        {step.title}
                                    </Text>
                                    <Tag
                                        variant={"neutral-base-outline"}
                                        content={step.typeLabel}
                                    />
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
                                                <span className={"text-neutral-muted"}>
                                                    {"Times"}
                                                </span>
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
                                {step.issues.length > 0 && (
                                    <div
                                        data-role={"issues"}
                                        className={
                                            "overflow-hidden rounded-lg border-sm border-neutral-dimmed text-sm"
                                        }
                                    >
                                        <div
                                            className={
                                                "border-b-sm border-neutral-dimmed bg-neutral-light px-sm py-xs text-xs font-semibold uppercase text-neutral-muted"
                                            }
                                        >
                                            {"Issues reported by the AI"}
                                        </div>
                                        {step.issues.map((issue, issueIndex) => (
                                            <div
                                                key={issueIndex}
                                                className={
                                                    "flex flex-col gap-xs border-b-sm border-neutral-dimmed p-sm last:border-b-0"
                                                }
                                            >
                                                <div
                                                    className={"flex flex-wrap items-center gap-sm"}
                                                >
                                                    <Tag
                                                        variant={issue.severityVariant}
                                                        content={issue.severityLabel}
                                                    />
                                                    <span className={"font-medium"}>
                                                        {issue.field}
                                                    </span>
                                                </div>
                                                <div>{issue.message}</div>
                                                <div className={"text-neutral-strong"}>
                                                    {issue.suggestion}
                                                </div>
                                            </div>
                                        ))}
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
                                                    <span className={"text-neutral-muted"}>
                                                        {attempt.numberText}
                                                    </span>
                                                    <span>{attempt.span}</span>
                                                    <span
                                                        className={cn(
                                                            "font-medium",
                                                            ATTEMPT_OUTCOME_CLASSES[
                                                                attempt.outcomeTone
                                                            ]
                                                        )}
                                                    >
                                                        {attempt.outcome}
                                                    </span>
                                                    {attempt.reason !== null && (
                                                        <span className={"text-neutral-strong"}>
                                                            {attempt.reason}
                                                        </span>
                                                    )}
                                                    {attempt.showTaskLink && taskId !== null && (
                                                        <Button
                                                            variant={"link"}
                                                            size={"sm"}
                                                            text={"Background task"}
                                                            icon={<OpenInNewIcon />}
                                                            iconPosition={"end"}
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
    const { namespace, reviewId, reviewsUrl, onClose, onChanged, fieldLabels } = props;
    const { contentTypeLabel, contentUrl } = props;
    const { presenter } = useFeature(ReviewDetailsPresenterFeature);

    useEffect(() => {
        presenter.init({
            namespace,
            reviewId,
            reviewsUrl,
            onClose,
            onChanged,
            fieldLabels,
            contentTypeLabel,
            contentUrl
        });
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
