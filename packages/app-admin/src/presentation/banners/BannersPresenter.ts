import { makeAutoObservable } from "mobx";
import { Banners } from "~/features/banners/abstractions.js";
import { BannersPresenter as Abstraction } from "./abstractions.js";

const SEVERITY: Record<Banners.Variant, number> = {
    info: 0,
    success: 1,
    warning: 2,
    error: 3
};

// The most severe banner, and the most recently shown one among equally severe banners.
function pickBanner(banners: Banners.Banner[]): Banners.Banner | null {
    let picked: Banners.Banner | null = null;

    for (const banner of banners) {
        if (!picked || SEVERITY[banner.variant] >= SEVERITY[picked.variant]) {
            picked = banner;
        }
    }

    return picked;
}

function toViewModel(banner: Banners.Banner): Abstraction.Banner {
    return {
        id: banner.id,
        variant: banner.variant,
        title: banner.title ?? null,
        message: banner.message,
        dismissible: banner.dismissible ?? false,
        actionLabel: banner.action?.label ?? null,
        actionDisabled: banner.action?.disabled ?? false
    };
}

class BannersPresenterImpl implements Abstraction.Interface {
    constructor(private banners: Banners.Interface) {
        makeAutoObservable(this);
    }

    get vm(): Abstraction.ViewModel {
        const banner = this.current;
        if (!banner) {
            return { banner: null };
        }

        return { banner: toViewModel(banner) };
    }

    runAction(): void {
        this.current?.action?.onClick();
    }

    dismiss(): void {
        const banner = this.current;
        if (banner) {
            this.banners.dismiss(banner.id);
        }
    }

    private get current(): Banners.Banner | null {
        const banners = this.banners.getBanners();
        return pickBanner(banners);
    }
}

export const BannersPresenter = Abstraction.createImplementation({
    implementation: BannersPresenterImpl,
    dependencies: [Banners]
});
