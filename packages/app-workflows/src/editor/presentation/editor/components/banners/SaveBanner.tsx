import React from "react";
import type { SaveBannerVm } from "~/editor/presentation/editor/abstractions.js";
import { EditorBanner } from "./EditorBanner.js";

export interface SaveBannerProps {
    banner: SaveBannerVm;
    onReload(): void;
    onRetry(): void;
    onDismiss(): void;
}

/*
 * The banner of a failed save (R276, Q43, QBZ-10, QBZ-18). The view model's flags drive it: Reload
 * when `canReload` (the duplicate-model banner), Try again when `canRetry` (the transport
 * failure), a dismiss button when `dismissible`; the test id is `{kind}-banner`.
 */
export const SaveBanner = ({ banner, onReload, onRetry, onDismiss }: SaveBannerProps) => {
    let actionLabel: string | null = null;
    let onAction = onDismiss;
    if (banner.canReload) {
        actionLabel = "Reload";
        onAction = onReload;
    } else if (banner.canRetry) {
        actionLabel = "Try again";
        onAction = onRetry;
    }

    return (
        <EditorBanner
            title={banner.title}
            message={banner.message}
            actionLabel={actionLabel}
            dismissible={banner.dismissible}
            testId={`${banner.kind}-banner`}
            onAction={onAction}
            onDismiss={onDismiss}
        />
    );
};
