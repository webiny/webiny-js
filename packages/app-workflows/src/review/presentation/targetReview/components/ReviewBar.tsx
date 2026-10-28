import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Button } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { ReactComponent as TimelineIcon } from "@webiny/icons/timeline.svg";
import { REVIEW_BAR_FRAME_CLASSES } from "./reviewBarAppearance.js";
import { REVIEW_ACTION_ICONS } from "./reviewBarAppearance.js";
import { REVIEW_NOTICE_ICONS } from "./reviewBarAppearance.js";
import { REVIEW_TILE_CLASSES } from "./reviewBarAppearance.js";
import { REVIEW_TILE_ICONS } from "./reviewBarAppearance.js";
import { ReviewDisabledActionButton } from "./ReviewDisabledActionButton.js";
import { ReviewBarFailed } from "./ReviewBarFailed.js";
import { ReviewBarSkeleton } from "./ReviewBarSkeleton.js";
import type { ReviewBarLayout } from "./ReviewBarLayout.js";
import { ReviewProgress } from "./ReviewProgress.js";
import { ReviewStepTag } from "./ReviewStepTag.js";
import { ReviewActionDialogs } from "../../actionDialog/components/ReviewActionDialogs.js";
import { RequestReviewDialog } from "../../requestReview/components/RequestReviewDialog.js";
import { toActionRequest } from "../../actionDialog/toActionRequest.js";
import type { TargetReviewPresenter } from "../abstractions.js";

export interface ReviewBarProps {
    presenter: TargetReviewPresenter.Interface;
    // The namespace of the bar's target; the action dialogs run on it (R353, R363).
    namespace: string;
    reviewsUrl: string | null;
    onOpenDetails?: () => void;
    // "card" in the CMS, "strip" under the page editor's top bar (UI-7).
    layout?: ReviewBarLayout;
}

/*
 * The review bar card or strip (README 6, UI-6, UI-7): state tile, review state tag, message, meta, lock
 * text, the actions the server allows and the progress row.
 */
export const ReviewBar = createReactiveComponent(function ReviewBar(props: ReviewBarProps) {
    const { presenter, namespace, reviewsUrl, onOpenDetails, layout = "card" } = props;
    const { vm } = presenter;

    if (vm.status === "noWorkflow") {
        return null;
    }
    if (vm.status === "loading") {
        return <ReviewBarSkeleton layout={layout} />;
    }
    if (vm.status === "failed") {
        return <ReviewBarFailed presenter={presenter} layout={layout} />;
    }

    const TileIcon = REVIEW_TILE_ICONS[vm.tile];
    const request = toActionRequest(vm.openAction);
    const target = { namespace: vm.namespace, targetRevisionId: vm.targetRevisionId };

    let notice: React.ReactElement | null = null;
    if (vm.contentNotice !== null) {
        const NoticeIcon = REVIEW_NOTICE_ICONS[vm.contentNotice.icon];
        notice = (
            <div
                data-role={"content-notice"}
                role={"status"}
                className={"flex items-center gap-sm rounded-md bg-success-subtle p-sm"}
            >
                <Icon icon={<NoticeIcon />} label={""} size={"sm"} />
                <Text size={"sm"}>{vm.contentNotice.text}</Text>
            </div>
        );
    }

    return (
        <>
            <div
                data-role={"review-bar"}
                className={cn("flex flex-col gap-sm-plus", REVIEW_BAR_FRAME_CLASSES[layout])}
            >
                <div className={"flex items-start gap-sm-plus"}>
                    <div
                        data-role={"review-bar-tile"}
                        className={cn(
                            "flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-md",
                            REVIEW_TILE_CLASSES[vm.tile]
                        )}
                    >
                        <Icon icon={<TileIcon />} label={""} size={"md"} />
                    </div>
                    <div className={"flex min-w-0 grow flex-col gap-xs"}>
                        <div className={"flex flex-wrap items-center gap-sm"}>
                            {vm.stateTag && (
                                <Tag variant={vm.stateTag.variant} content={vm.stateTag.label} />
                            )}
                            <Text size={"md"} className={"font-semibold"}>
                                {vm.message}
                            </Text>
                        </div>
                        <div
                            data-role={"review-bar-meta"}
                            className={
                                "flex flex-wrap items-center gap-sm-plus text-sm text-neutral-strong"
                            }
                        >
                            {vm.stepColor !== null && (
                                <span
                                    data-role={"review-bar-step-dot"}
                                    className={"inline-block size-[8px] shrink-0 rounded-full"}
                                    style={{ backgroundColor: vm.stepColor }}
                                />
                            )}
                            {vm.stepMeta ? <span>{vm.stepMeta}</span> : null}
                            {vm.stepStateTag && (
                                <ReviewStepTag
                                    tag={vm.stepStateTag}
                                    tooltip={vm.stepStateTooltip}
                                />
                            )}
                            {vm.ownerName ? (
                                <span>
                                    {"Owner: "}
                                    <b>{vm.ownerName}</b>
                                </span>
                            ) : null}
                            {vm.lockText && <span>{vm.lockText}</span>}
                        </div>
                    </div>
                    <div
                        data-role={"review-bar-actions"}
                        className={"flex flex-wrap items-center justify-end gap-sm"}
                    >
                        {vm.actions.map(action => {
                            if (action.disabledReason !== null) {
                                return (
                                    <ReviewDisabledActionButton
                                        key={action.kind}
                                        action={action}
                                        reason={action.disabledReason}
                                    />
                                );
                            }
                            const ActionIcon = REVIEW_ACTION_ICONS[action.icon];
                            return (
                                <Button
                                    key={action.kind}
                                    variant={action.emphasis}
                                    size={"md"}
                                    text={action.label}
                                    icon={<ActionIcon />}
                                    disabled={vm.busy}
                                    onClick={() => presenter.openAction(action.kind, action.stepId)}
                                />
                            );
                        })}
                    </div>
                </div>
                {vm.progress && (
                    <div
                        data-role={"review-bar-progress"}
                        className={
                            "flex items-center justify-between gap-sm border-t-sm border-neutral-subtle pt-sm"
                        }
                    >
                        <ReviewProgress progress={vm.progress} />
                        {onOpenDetails && (
                            <Button
                                variant={"ghost"}
                                size={"sm"}
                                text={"Review details"}
                                icon={<TimelineIcon />}
                                onClick={onOpenDetails}
                            />
                        )}
                    </div>
                )}
                {notice}
            </div>
            {vm.openAction !== null && vm.openAction.kind === "request" && (
                <RequestReviewDialog
                    target={target}
                    targetTitle={vm.targetTitle}
                    reviewsUrl={reviewsUrl}
                    onConflict={() => presenter.refresh()}
                    onDone={() => presenter.actionDone()}
                    onClose={() => presenter.closeAction()}
                />
            )}
            <ReviewActionDialogs
                namespace={namespace}
                request={request}
                reviewsUrl={reviewsUrl}
                onConflict={() => presenter.refresh()}
                onDone={() => presenter.actionDone()}
                onClose={() => presenter.closeAction()}
            />
        </>
    );
});
