import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Button, EmptyState, Icon, Text } from "@webiny/admin-ui";
import { ReactComponent as CloudOffIcon } from "@webiny/icons/cloud_off.svg";
import { ReactComponent as RefreshIcon } from "@webiny/icons/refresh.svg";
import { ReviewBarFrame } from "./ReviewBarFrame.js";
import type { ReviewBarLayout } from "./ReviewBarLayout.js";
import type { TargetReviewPresenter } from "../abstractions.js";

export interface ReviewBarFailedProps {
    presenter: TargetReviewPresenter.Interface;
    layout?: ReviewBarLayout;
}

/*
 * A failed load (QBZ-1): the bar card with a cloud_off tile, the title, the lock text and Try
 * again. A read without access (R225) is an empty state with no retry.
 */
export const ReviewBarFailed = createReactiveComponent(function ReviewBarFailed(
    props: ReviewBarFailedProps
) {
    const { presenter, layout = "card" } = props;
    const { vm } = presenter;

    if (vm.failureKind === "noAccess") {
        return (
            <EmptyState
                type={"content"}
                illustration={true}
                title={"You don't have access to this content"}
                description={vm.message}
            />
        );
    }

    return (
        <ReviewBarFrame layout={layout} data-role={"review-bar"}>
            <div className={"flex items-start gap-sm-plus"}>
                <Icon
                    data-role={"review-bar-failed-tile"}
                    icon={<CloudOffIcon />}
                    label={""}
                    size={"lg"}
                    color={"neutral-strong"}
                />
                <div className={"flex min-w-0 grow flex-col gap-xs"}>
                    <Text size={"md"}>{vm.message}</Text>
                    <Text size={"sm"}>{vm.lockText}</Text>
                </div>
                <Button
                    variant={"tertiary"}
                    size={"md"}
                    text={"Try again"}
                    icon={<RefreshIcon />}
                    disabled={vm.busy}
                    onClick={() => presenter.refresh()}
                />
            </div>
        </ReviewBarFrame>
    );
});
