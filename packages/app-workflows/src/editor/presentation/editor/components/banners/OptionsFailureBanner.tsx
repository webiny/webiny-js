import React from "react";
import type { OptionsBannerVm } from "~/editor/presentation/editor/abstractions.js";
import { EditorBanner } from "./EditorBanner.js";

export interface OptionsFailureBannerProps {
    banner: OptionsBannerVm;
    onRetry(): void;
}

// A step option list failed to load while the editor loaded (Q43, R281); Try again reloads it.
export const OptionsFailureBanner = ({ banner, onRetry }: OptionsFailureBannerProps) => {
    return (
        <EditorBanner
            title={null}
            message={banner.message}
            actionLabel="Try again"
            dismissible={false}
            testId="options-banner"
            onAction={onRetry}
        />
    );
};
