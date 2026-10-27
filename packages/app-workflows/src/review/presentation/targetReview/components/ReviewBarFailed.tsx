import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Button, EmptyState, Icon, Text } from "@webiny/admin-ui";
import { ReactComponent as CloudOffIcon } from "@webiny/icons/cloud_off.svg";
import { ReactComponent as RefreshIcon } from "@webiny/icons/refresh.svg";
import type { TargetReviewPresenter } from "../abstractions.js";

export interface ReviewBarFailedProps {
    presenter: TargetReviewPresenter.Interface;
}

/*
 * A failed load (QBZ-1): the bar card with a cloud_off tile, the title, the lock text and Try
 * again. A read without access (R225) is an empty state with no retry.
 */
export const ReviewBarFailed = createReactiveComponent(function ReviewBarFailed(
    props: ReviewBarFailedProps
) {
    const { presenter } = props;
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
        <div
            data-role={"review-bar"}
            className={
                "mx-md my-md flex items-start gap-sm-plus rounded-lg bg-neutral-base p-md shadow-sm"
            }
        >
            <div
                data-role={"review-bar-failed-tile"}
                className={
                    "flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-md bg-destructive-subtle fill-destructive"
                }
            >
                <Icon icon={<CloudOffIcon />} label={""} size={"md"} />
            </div>
            <div className={"flex min-w-0 grow flex-col gap-xs"}>
                <Text size={"md"} className={"font-semibold"}>
                    {vm.message}
                </Text>
                <Text size={"sm"} className={"text-neutral-strong"}>
                    {vm.lockText}
                </Text>
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
    );
});
