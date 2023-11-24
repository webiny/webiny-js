import { makeAutoObservable, toJS } from "mobx";
import groupBy from "lodash/groupBy";

import { IconRepository } from "./IconRepository";
import { Icon, IconPickerGridRow } from "./types";
import { IconType } from "~/components/IconPicker/config";

const COLUMN_COUNT = 8;

export interface IconPickerPresenterInterface {
    load(icon: Icon): Promise<void>;
    setIcon(icon: Icon): void;
    // addIcon(icon: Icon): void;
    setFilter(value: string): void;
    setActiveTab(index: number): void;
    getActiveTab(type: string): number;
    openMenu(): void;
    closeMenu(): void;
    get vm(): {
        isLoading: boolean;
        activeTab: number;
        isMenuOpened: boolean;
        // TODO: I would not do this grouping in the Presenter, but rather in the component that actually renders
        // these groups. Its a VERY UI specific logic, which changes the shape of the data only to satisfy
        // that UI list. Instead of `data`, assign all `icons`, filtered by keyword, and that's it. Then group into rows
        // where you're rendering them, in the `<IconPickerTab>`
        data: { type: string; rows: IconPickerGridRow[] }[];
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
            data: this.getData(),
            iconTypes: this.repository.getIconTypes(),
            // `toJS` will unwrap an observable into a POJO. This will make it simple to use in child components.
            selectedIcon: toJS(this.selectedIcon),
            filter: this.filter
        };
    }

    // addIcon(icon: Icon) {
    //     // TODO:
    //     // this.repository.addIcon(icon)
    // }

    closeMenu(): void {
        console.log("presenter.closeMenu()");
        this.isMenuOpened = false;
    }

    openMenu(): void {
        console.log("presenter.openMenu()");
        this.isMenuOpened = true;
    }

    private getGroupedIcons() {
        const icons = this.repository.getIcons();

        const hyphenUnderscoreRegex = /[-_]/g;
        const grouped = groupBy(icons, "type");

        return Object.keys(grouped).map(type => ({
            type: type,
            icons: grouped[type].filter(icon =>
                icon.name
                    .replace(hyphenUnderscoreRegex, " ")
                    .toLowerCase()
                    .includes(this.filter.toLowerCase())
            )
        }));
    }

    private getRows(icons: Icon[]) {
        // Group the icons by their category.
        const groupedObjects = groupBy(icons, "category");
        const rows: IconPickerGridRow[] = [];

        // Iterate over each category in the grouped icons.
        for (const key in groupedObjects) {
            // Skip any group where the key is `undefined` (these icons will be handled separately).
            if (key !== "undefined") {
                const rowIcons = groupedObjects[key];

                // Add a row for the category name.
                rows.push({ type: "category-name", name: key });

                // Split the icons in this category into groups of COLUMN_COUNT and add them as rows.
                while (rowIcons.length) {
                    rows.push({ type: "icons", icons: rowIcons.splice(0, COLUMN_COUNT) });
                }
            }
        }

        // Handle icons that don't have a category (key is `undefined`).
        if (groupedObjects.undefined) {
            const rowIcons = groupedObjects.undefined;

            // Add a row for the `Uncategorized` category name.
            rows.push({ type: "category-name", name: "Uncategorized" });

            // Split these icons into groups of COLUMN_COUNT and add them as rows.
            while (rowIcons.length) {
                rows.push({ type: "icons", icons: rowIcons.splice(0, COLUMN_COUNT) });
            }
        }

        return rows;
    }

    private getData() {
        const groups = this.getGroupedIcons();

        return groups.map(group => ({
            type: group.type,
            rows: this.getRows(group.icons)
        }));
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
