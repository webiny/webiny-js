import { makeAutoObservable } from "mobx";
import {
    BreadcrumbsPresenter as Abstraction,
    type BreadcrumbTrailItem,
    type BreadcrumbsViewModel
} from "./abstractions.js";

export class BreadcrumbsPresenter implements Abstraction.Interface {
    private items: BreadcrumbTrailItem[] = [];

    constructor() {
        makeAutoObservable(this);
    }

    get vm(): BreadcrumbsViewModel {
        return {
            items: this.items
        };
    }

    setTrail(items: BreadcrumbTrailItem[]): void {
        this.items = items;
    }

    clear(): void {
        this.items = [];
    }
}
