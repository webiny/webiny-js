import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { BannersFeature } from "~/features/banners/feature.js";
import type { Banners } from "~/features/banners/abstractions.js";

export type BannerProps = Banners.Banner;

/**
 * Shows a banner for as long as this component is mounted, and hides it on unmount. Renders
 * nothing itself; the Layout's bar does the drawing.
 *
 * For a banner whose lifetime isn't tied to a component, inject `Banners` and call `show()` and
 * `hide()` directly.
 */
export const Banner = (props: BannerProps) => {
    const { banners } = useFeature(BannersFeature);
    const { id, variant, title, message, dismissible, action } = props;

    useEffect(() => {
        banners.show({ id, variant, title, message, dismissible, action });
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
        return () => banners.hide(id);
    }, [id]);

    return null;
};
