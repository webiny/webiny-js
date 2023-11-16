import { makeAutoObservable } from "mobx";
import groupBy from "lodash/groupBy";

import { IconRepository } from "./domain";
import { Row, Icon } from "./types";

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

    async load(value: Icon) {
        this.selectedIcon = value;

        if (value.color) {
            this.color = value.color;
        }

        await this.repository.loadProviders();
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
        const groupedObjects = groupBy(icons, "category");
        const rows: Row[] = [];

        for (const key in groupedObjects) {
            if (key !== "undefined") {
                const rowIcons = groupedObjects[key];

                rows.push({ type: "category-name", name: key });

                while (rowIcons.length) {
                    rows.push({ type: "icons", icons: rowIcons.splice(0, COLUMN_COUNT) });
                }
            }
        }

        if (groupedObjects.undefined) {
            const rowIcons = groupedObjects.undefined;

            rows.push({ type: "category-name", name: "Uncategorized" });

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
}
