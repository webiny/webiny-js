import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Alert } from "@webiny/admin-ui";
import { Button } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { Separator } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as TimelineIcon } from "@webiny/icons/timeline.svg";
import { REVIEW_ACTION_ICONS } from "./reviewBarAppearance.js";
import { REVIEW_NOTICE_ICONS } from "./reviewBarAppearance.js";
import { REVIEW_TILE_ICON_COLORS } from "./reviewBarAppearance.js";
import { REVIEW_TILE_ICONS } from "./reviewBarAppearance.js";
import { ReviewDisabledActionButton } from "./ReviewDisabledActionButton.js";
import { ReviewBarFrame } from "./ReviewBarFrame.js";
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
            <Alert
                data-role={"content-notice"}
                role={"status"}
                type={"success"}
                variant={"subtle"}
                icon={<NoticeIcon />}
            >
                <Text size={"sm"}>{vm.contentNotice.text}</Text>
            </Alert>
        );
    }

    return (
        <>
            <ReviewBarFrame layout={layout} data-role={"review-bar"}>
                <div className={"flex flex-col gap-sm-plus"}>
                    <div className={"flex items-start gap-sm-plus"}>
                        <Icon
                            data-role={"review-bar-tile"}
                            icon={<TileIcon />}
                            label={""}
                            size={"lg"}
                            color={REVIEW_TILE_ICON_COLORS[vm.tile]}
                        />
                        <div className={"flex min-w-0 grow flex-col gap-xs"}>
                            <div className={"flex flex-wrap items-center gap-sm"}>
                                {vm.stateTag && (
                                    <Tag
                                        variant={vm.stateTag.variant}
                                        content={vm.stateTag.label}
                                    />
                                )}
                                <Text size={"md"}>{vm.message}</Text>
                            </div>
                            <div
                                data-role={"review-bar-meta"}
                                className={"flex flex-wrap items-center gap-sm-plus"}
                            >
                                {vm.stepMeta !== null && vm.stepColor !== null ? (
                                    <Tag content={vm.stepMeta} swatchColor={vm.stepColor} />
                                ) : null}
                                {vm.stepMeta !== null && vm.stepColor === null ? (
                                    <Text size={"sm"}>{vm.stepMeta}</Text>
                                ) : null}
                                {vm.stepStateTag && (
                                    <ReviewStepTag
                                        tag={vm.stepStateTag}
                                        tooltip={vm.stepStateTooltip}
                                    />
                                )}
                                {vm.ownerName ? (
                                    <Text size={"sm"}>{`Owner: ${vm.ownerName}`}</Text>
                                ) : null}
                                {vm.lockText && (
                                    <Text
                                        data-role={"review-bar-lock-text"}
                                        size={"sm"}
                                        className={"min-w-0 break-words"}
                                    >
                                        {vm.lockText}
                                    </Text>
                                )}
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
                                        onClick={() =>
                                            presenter.openAction(action.kind, action.stepId)
                                        }
                                    />
                                );
                            })}
                        </div>
                    </div>
                    {vm.progress && (
                        <>
                            <Separator />
                            <div
                                data-role={"review-bar-progress"}
                                className={"flex items-center justify-between gap-sm"}
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
                        </>
                    )}
                    {notice}
                </div>
            </ReviewBarFrame>
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
