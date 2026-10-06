import { createAbstraction } from "@webiny/feature/admin";

export type BannerVariant = "info" | "success" | "warning" | "error";

export interface IBannerAction {
    label: string;
    onClick(): void;
    disabled?: boolean;
}

export interface IBanner {
    // Identifies the banner, so showing it again replaces it instead of adding a second one.
    id: string;
    variant: BannerVariant;
    // Shown in bold before the message.
    title?: string;
    message: string;
    // Adds a close button. Leave it off for banners that must stay until their cause goes away.
    dismissible?: boolean;
    action?: IBannerAction;
}

/**
 * App-wide banners across the top of the Admin, above the header bar. Any feature can inject this
 * and show a banner without depending on React or on the Layout.
 *
 * Only one banner is on screen at a time: the most severe one, and the most recently shown among
 * equally severe ones. The rest wait until it is hidden.
 */
export interface IBanners {
    show(banner: IBanner): void;
    hide(id: string): void;
    getBanners(): IBanner[];
}

export const Banners = createAbstraction<IBanners>("Banners");

export namespace Banners {
    export type Interface = IBanners;
    export type Banner = IBanner;
    export type Variant = BannerVariant;
    export type Action = IBannerAction;
}
