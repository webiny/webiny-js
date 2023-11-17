import { makeAutoObservable } from "mobx";
import groupBy from "lodash/groupBy";

import { IconRepository } from "./domain";
import { Row, Icon } from "./types";
import { Emoji } from "./config/IconPackProvider";

const COLUMN_COUNT = 8;

export interface IconPickerPresenterInterface {
    load(icon: Icon): Promise<void>;
    setIcon(icon: Icon): void;
    filterIcons(value: string): void;
    get vm(): {
        isLoading: boolean;
        data: { type: string; rows: Row[] }[];
        selectedIcon: Icon | null;
        filter: string;
        color: string;
    };
}

export class IconPickerPresenter implements IconPickerPresenterInterface {
    private repository: IconRepository;
    private selectedIcon: Icon | null = null;
    private filter = "";
    private color = "#757575";

    constructor(repository: IconRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async load(value: Icon | null = null) {
        this.selectedIcon = value;

        if (value?.color) {
            this.color = value.color;
        }

        await this.repository.loadIcons();
    }

    get vm() {
        return {
            isLoading: this.repository.getLoading().isLoading,
            data: this.getData(),
            selectedIcon: this.selectedIcon,
            filter: this.filter,
            color: this.color
        };
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
        const rows: Row[] = [];

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

    setIcon(icon: Icon) {
        this.selectedIcon = icon;
    }

    setColor(color: string) {
        this.color = color;
    }

    filterIcons(value: string) {
        this.filter = value;
    }

    checkSkinToneSupport(iconToCheck: Icon) {
        const icons = this.repository.getIcons();

        return (
            icons
                .filter(icon => icon.type === "emoji")
                // Assert the icon as an Emoji based on the filter.
                .find((icon): icon is Emoji => icon.value === iconToCheck.value)?.skinToneSupport ||
            false
        );
    }
}
