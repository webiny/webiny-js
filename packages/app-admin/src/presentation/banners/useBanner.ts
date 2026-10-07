import { useMemo } from "react";
import { useFeature } from "@webiny/app";
import { BannersFeature } from "~/features/banners/feature.js";
import type { Banners } from "~/features/banners/abstractions.js";

export interface UseBannerResponse {
    // Shows the banner, or updates it in place if one with the same `id` is already showing.
    showBanner(banner: Banners.Banner): void;
    hideBanner(id: string): void;
}

/**
 * Shows banners from event handlers, the way `useToast` shows toasts. For a banner that should show
 * for as long as a component is mounted, render `<Banner>` instead.
 */
export const useBanner = (): UseBannerResponse => {
    const { banners } = useFeature(BannersFeature);

    return useMemo(() => {
        return {
            showBanner: (banner: Banners.Banner) => banners.show(banner),
            hideBanner: (id: string) => banners.hide(id)
        };
    }, [banners]);
};
