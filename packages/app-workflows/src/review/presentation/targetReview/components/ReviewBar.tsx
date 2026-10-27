import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Button } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { REVIEW_ACTION_ICONS } from "./reviewBarAppearance.js";
import { REVIEW_NOTICE_ICONS } from "./reviewBarAppearance.js";
import { REVIEW_TILE_CLASSES } from "./reviewBarAppearance.js";
import { REVIEW_TILE_ICONS } from "./reviewBarAppearance.js";
import { ReviewBarFailed } from "./ReviewBarFailed.js";
import { ReviewBarSkeleton } from "./ReviewBarSkeleton.js";
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
}

/*
 * The review bar card (README 6, UI-6, UI-7): state tile, review state tag, message, meta, lock
 * text, the actions the server allows and the progress row.
 */
export const ReviewBar = createReactiveComponent(function ReviewBar(props: ReviewBarProps) {
    const { presenter, namespace, reviewsUrl, onOpenDetails } = props;
    const { vm } = presenter;

    if (vm.status === "noWorkflow") {
        return null;
    }
    if (vm.status === "loading") {
        return <ReviewBarSkeleton />;
    }
    if (vm.status === "failed") {
        return <ReviewBarFailed presenter={presenter} />;
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
                className={
                    "mx-md my-md flex flex-col gap-sm-plus rounded-lg bg-neutral-base p-md shadow-sm"
                }
            >
                <div className={"flex items-start gap-sm-plus"}>
                    <div
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
                            className={
                                "flex flex-wrap items-center gap-sm-plus text-sm text-neutral-strong"
                            }
                        >
                            {vm.stepMeta ? <span>{vm.stepMeta}</span> : null}
                            {vm.stepStateTag && (
                                <ReviewStepTag
                                    tag={vm.stepStateTag}
                                    tooltip={vm.stepStateTooltip}
                                />
                            )}
                            {vm.ownerMeta ? <span>{vm.ownerMeta}</span> : null}
                        </div>
                        {vm.lockText && (
                            <Text size={"sm"} className={"text-neutral-strong"}>
                                {vm.lockText}
                            </Text>
                        )}
                    </div>
                    <div className={"flex flex-wrap items-center justify-end gap-sm"}>
                        {vm.actions.map(action => {
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
                    <div className={"flex items-center justify-between gap-sm"}>
                        <ReviewProgress progress={vm.progress} />
                        {onOpenDetails && (
                            <Button
                                variant={"ghost"}
                                size={"sm"}
                                text={"Review details"}
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
