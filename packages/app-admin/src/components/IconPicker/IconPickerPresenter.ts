import { makeAutoObservable, toJS } from "mobx";

import { IconRepository } from "./IconRepository";
import { Icon } from "./types";
import { IconType } from "./config";
import { ProviderIcon } from "./config/IconPackProvider";

export interface IconPickerPresenterInterface {
    load(icon: Icon): Promise<void>;
    setIcon(icon: Icon): void;
    addIcon(icon: Icon): void;
    setFilter(value: string): void;
    setActiveTab(index: number): void;
    getActiveTab(type: string): number;
    openMenu(): void;
    closeMenu(): void;
    get vm(): {
        isLoading: boolean;
        activeTab: number;
        isMenuOpened: boolean;
        icons: Icon[];
        iconTypes: IconType[];
        selectedIcon: Icon | null;
        filter: string;
    };
}

export class IconPickerPresenter implements IconPickerPresenterInterface {
    private repository: IconRepository;
    private selectedIcon: Icon | null = null;
    private filter = "";
    private activeTab = 0;
    private isMenuOpened = false;

    constructor(repository: IconRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async load(value: Icon | null = null) {
        this.selectedIcon = value;

        await this.repository.loadIcons();
    }

    get vm() {
        console.log("vm.isMenuOpened", this.isMenuOpened);
        return {
            activeTab: this.activeTab,
            isMenuOpened: this.isMenuOpened,
            isLoading: this.repository.getLoading().isLoading,
            icons: this.getFilteredIcons(),
            iconTypes: this.repository.getIconTypes(),
            // `toJS` will unwrap an observable into a POJO. This will make it simple to use in child components.
            selectedIcon: toJS(this.selectedIcon),
            filter: this.filter
        };
    }

    addIcon(icon: Icon) {
        this.repository.addIcon(icon as ProviderIcon);
    }

    closeMenu(): void {
        console.log("presenter.closeMenu()");
        this.isMenuOpened = false;
    }

    openMenu(): void {
        console.log("presenter.openMenu()");
        this.isMenuOpened = true;
    }

    private getFilteredIcons() {
        const hyphenUnderscoreRegex = /[-_]/g;
        const icons = this.repository.getIcons();

        return icons.filter(icon =>
            icon.name
                .replace(hyphenUnderscoreRegex, " ")
                .toLowerCase()
                .includes(this.filter.toLowerCase())
        );
    }

    setActiveTab(index: number) {
        this.activeTab = index;
    }

    getActiveTab(type: string) {
        return this.vm.iconTypes.findIndex(iconsByType => iconsByType.name === type);
    }

    setIcon(icon: Icon) {
        console.log("set icon", icon);
        this.selectedIcon = icon;
    }

    setFilter(value: string) {
        this.filter = value;
    }
}
