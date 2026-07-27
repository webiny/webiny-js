import { makeAutoObservable } from "mobx";
import type { MatchedRoute } from "@webiny/app/features/router/abstractions.js";
import {
    BreadcrumbsPresenter as Abstraction,
    type IBreadcrumb,
    type BreadcrumbTrailItem,
    type BreadcrumbsViewModel
} from "./abstractions.js";

export class BreadcrumbsPresenter implements Abstraction.Interface {
    // Trail set imperatively by a view via `useBreadcrumbs` (dynamic trails).
    private dynamicTrail: BreadcrumbTrailItem[] = [];

    constructor(
        private getBreadcrumbs: () => IBreadcrumb[],
        private getMatchedRoute: () => MatchedRoute | undefined
    ) {
        makeAutoObservable(this);
    }

    get vm(): BreadcrumbsViewModel {
        // A DI breadcrumb registered for the current route wins — that's the React-free path.
        const matched = this.getMatchedRoute();
        if (matched) {
            const breadcrumb = this.getBreadcrumbs().find(b => b.route.name === matched.name);
            if (breadcrumb) {
                return { items: breadcrumb.getTrail(matched) };
            }
        }

        // Otherwise fall back to whatever a view declared via the hook.
        return { items: this.dynamicTrail };
    }

    setTrail(items: BreadcrumbTrailItem[]): void {
        this.dynamicTrail = items;
    }

    clear(): void {
        this.dynamicTrail = [];
    }
}
