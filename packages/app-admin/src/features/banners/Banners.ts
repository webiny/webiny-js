import { makeAutoObservable } from "mobx";
import { Banners as Abstraction } from "./abstractions.js";

class BannersImpl implements Abstraction.Interface {
    private banners: Abstraction.Banner[] = [];
    private dismissed = new Set<string>();

    constructor() {
        makeAutoObservable(this);
    }

    show(banner: Abstraction.Banner): void {
        if (this.dismissed.has(banner.id)) {
            return;
        }

        const index = this.banners.findIndex(item => item.id === banner.id);

        // Replace in place, so updating a banner doesn't make it the most recent one.
        if (index >= 0) {
            this.banners[index] = banner;
            return;
        }

        this.banners.push(banner);
    }

    hide(id: string): void {
        this.dismissed.delete(id);
        this.remove(id);
    }

    dismiss(id: string): void {
        this.dismissed.add(id);
        this.remove(id);
    }

    getBanners(): Abstraction.Banner[] {
        return this.banners;
    }

    private remove(id: string): void {
        this.banners = this.banners.filter(banner => banner.id !== id);
    }
}

export const Banners = Abstraction.createImplementation({
    implementation: BannersImpl,
    dependencies: []
});
