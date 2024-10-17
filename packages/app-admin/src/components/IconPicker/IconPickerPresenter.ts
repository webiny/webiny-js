import { makeAutoObservable, toJS } from "mobx";

import { IconRepository } from "./IconRepository";
import { Icon } from "./types";
import { IconType } from "./config";

export interface IconPickerPresenterInterface {
    load(icon: Icon): Promise<void>;
    setIcon(icon: Icon): void;
    addIcon(icon: Icon): void;
    setFilter(value: string): void;
    setActiveTab(index: number): void;
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
        size?: string;
    };
}

export class IconPickerPresenter implements IconPickerPresenterInterface {
    private repository: IconRepository;
    private selectedIcon: Icon | null = null;
    private filter = "";
    private activeTab = 0;
    private isMenuOpened = false;
    private size: string | undefined;

    constructor(repository: IconRepository, size?: string) {
        this.repository = repository;
        this.size = size;
        makeAutoObservable(this);
    }

    async load(value: Icon | null = null) {
        this.selectedIcon = value;

        await this.repository.loadIcons();
    }

    get vm() {
        return {
            activeTab: this.activeTab,
            isMenuOpened: this.isMenuOpened,
            isLoading: this.repository.getLoading().isLoading,
            icons: this.getFilteredIcons(),
            iconTypes: this.repository.getIconTypes(),
            // `toJS` will unwrap an observable into a POJO. This will make it simple to use in child components.
            selectedIcon: toJS(this.selectedIcon),
            filter: this.filter,
            size: this.size
        };
    }

    addIcon(icon: Icon) {
        this.repository.addIcon(icon);
    }

    closeMenu(): void {
        this.isMenuOpened = false;
    }

    openMenu(): void {
        this.isMenuOpened = true;
        this.resetActiveTab();
    }

    setActiveTab(index: number) {
        this.activeTab = index;
    }

    setIcon(icon: Icon | null) {
        this.selectedIcon = icon;
    }

    setFilter(value: string) {
        this.filter = value;
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

    private getActiveTabByType(type: string) {
        const iconTypes = this.repository.getIconTypes();
        const index = iconTypes.findIndex(iconsByType => iconsByType.name === type);

        return index !== -1 ? index : 0;
    }

    private resetActiveTab() {
        this.setActiveTab(this.selectedIcon ? this.getActiveTabByType(this.selectedIcon.type) : 0);
    }
}
