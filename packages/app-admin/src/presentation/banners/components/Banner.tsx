import { useEffect } from "react";
import type { Banners } from "~/features/banners/abstractions.js";
import { useBanner } from "../useBanner.js";

export type BannerProps = Banners.Banner;

/**
 * Shows a banner for as long as this component is mounted, and hides it on unmount. Renders
 * nothing itself; the Layout's bar does the drawing.
 *
 * To show a banner from an event handler, use `useBanner()`. Outside React, inject `Banners`
 * and call `show()` and `hide()` directly.
 */
export const Banner = (props: BannerProps) => {
    const { showBanner, hideBanner } = useBanner();
    const { id, variant, title, message, dismissible, action } = props;

    useEffect(() => {
        showBanner({ id, variant, title, message, dismissible, action });
    }, [
        id,
        variant,
        title,
        message,
        dismissible,
        action?.label,
        action?.disabled,
        action?.onClick
    ]);

    useEffect(() => {
        return () => hideBanner(id);
    }, [id]);

    return null;
};
