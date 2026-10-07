import React from "react";
import { useFeature } from "@webiny/app";
import { Button } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import { createReactiveComponent } from "~/presentation/createReactiveComponent.js";
import { BannersPresenterFeature } from "../feature.js";
import type { BannersPresenter } from "../abstractions.js";

const VARIANT_CLASS_NAMES: Record<BannersPresenter.Banner["variant"], string> = {
    info: "bg-neutral-dimmed",
    success: "bg-success-subtle",
    warning: "bg-warning",
    error: "bg-destructive-subtle"
};

function fullText(banner: BannersPresenter.Banner): string {
    if (!banner.title) {
        return banner.message;
    }
    return `${banner.title} ${banner.message}`;
}

/**
 * The bar across the top of the content column, above the header. Rendered once, by the Layout.
 *
 * It is always exactly `--spacing-banner` tall, and the text is cut to one line, with the full text
 * in the tooltip. A known height is what lets the Layout take the bar out of `h-main-content` with
 * plain CSS, instead of measuring the bar at runtime.
 */
export const BannerBar = createReactiveComponent(() => {
    const { presenter } = useFeature(BannersPresenterFeature);
    const { banner } = presenter.vm;

    if (!banner) {
        return null;
    }

    let action = null;
    if (banner.actionLabel) {
        action = (
            <Button
                variant={"ghost"}
                size={"sm"}
                text={banner.actionLabel}
                disabled={banner.actionDisabled}
                onClick={() => presenter.runAction()}
            />
        );
    }

    let close = null;
    if (banner.dismissible) {
        close = (
            <IconButton
                variant={"ghost"}
                size={"sm"}
                icon={<CloseIcon />}
                aria-label={"Dismiss banner"}
                onClick={() => presenter.dismiss()}
            />
        );
    }

    return (
        <div
            className={cn(
                "grid h-banner grid-cols-[1fr_minmax(0,max-content)_1fr] items-center gap-sm px-sm",
                VARIANT_CLASS_NAMES[banner.variant]
            )}
            data-admin-banner={banner.variant}
            data-testid={"admin-banner"}
        >
            <span />
            <Text
                size={"sm"}
                className={"truncate text-center text-neutral-primary"}
                title={fullText(banner)}
            >
                {banner.title ? <strong>{`${banner.title} `}</strong> : null}
                {banner.message}
            </Text>
            <div className={"flex items-center justify-self-end gap-xs"}>
                {action}
                {close}
            </div>
        </div>
    );
});
