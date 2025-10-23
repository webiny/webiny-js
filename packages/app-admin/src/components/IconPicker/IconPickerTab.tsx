import React, { Fragment } from "react";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { List } from "react-virtualized";
import groupBy from "lodash/groupBy.js";

import { Text, DelayedOnChange, Input, Tabs, Icon as IconComponent } from "@webiny/admin-ui";
import { makeDecoratable } from "@webiny/react-composition";

import { useIconPicker } from "./IconPickerPresenterProvider.js";
import { useIconType } from "./config/IconType.js";
import { IconPickerCell, IconPickerRow } from "./components/index.js";
import type { Icon, IconPickerGridRow } from "./types.js";
import { ICON_PICKER_SIZE } from "./types.js";

const COLUMN_COUNT = 8;

export const IconPickerTabRenderer = makeDecoratable("IconPickerTabRenderer", () => null);

const getRows = (icons: Icon[], size?: string) => {
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
                rows.push({
                    type: "icons",
                    icons: rowIcons.splice(0, size === ICON_PICKER_SIZE.SMALL ? 6 : COLUMN_COUNT)
                });
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
            rows.push({
                type: "icons",
                icons: rowIcons.splice(0, size === ICON_PICKER_SIZE.SMALL ? 6 : COLUMN_COUNT)
            });
        }
    }

    return rows;
};

const useIconTypeRows = (type: string) => {
    const presenter = useIconPicker();
    const icons = presenter.vm.icons.filter(icon => icon.type === type);
    const rows = getRows(icons, presenter.vm.size);

    return {
        isEmpty: rows.length === 0,
        rows,
        rowCount: rows.length
    };
};

interface RenderRowProps {
    onIconClick: (icon: Icon) => void;
    style: Record<string, any>;
    row: IconPickerGridRow;
    cellDecorator: CellDecorator;
}

const RowRenderer = ({ row, style, cellDecorator, onIconClick }: RenderRowProps) => {
    const presenter = useIconPicker();
    const value = presenter.vm.selectedIcon;

    if (row.type === "category-name") {
        return (
            <IconPickerRow style={style}>
                <Text
                    size={"sm"}
                    className={"uppercase self-end text-neutral-muted mb-sm"}
                >
                    {row.name}
                </Text>
            </IconPickerRow>
        );
    }

    return (
        <IconPickerRow style={style}>
            {row.icons.map((item, itemKey) => (
                <Fragment key={itemKey}>
                    {cellDecorator(
                        <IconPickerCell
                            key={itemKey}
                            icon={item}
                            isActive={item.name === value?.name}
                            onIconClick={() => onIconClick(item)}
                        />
                    )}
                </Fragment>
            ))}
        </IconPickerRow>
    );
};

interface CellDecorator {
    (cell: React.ReactElement): React.ReactElement;
}

const noopDecorator: CellDecorator = cell => cell;

export interface IconPickerTabProps {
    label: string;
    value: string;
    onChange: (icon: Icon) => void;
    actions?: React.ReactElement;
    cellDecorator?: CellDecorator;
}

export const IconPickerTab = ({
    label,
    value,
    actions,
    onChange,
    cellDecorator = noopDecorator
}: IconPickerTabProps) => {
    const { type } = useIconType();
    const { isEmpty, rowCount, rows } = useIconTypeRows(type);
    const presenter = useIconPicker();
    const size = presenter.vm.size;

    return (
        <Tabs.Tab
            value={value}
            trigger={label}
            content={
                <div>
                    <div className={"flex items-center justify-center gap-sm"}>
                        <DelayedOnChange
                            value={presenter.vm.filter}
                            onChange={value => presenter.setFilter(value)}
                        >
                            {({ value, onChange }) => (
                                <Input
                                    value={value}
                                    onChange={value => onChange(value as unknown as string)}
                                    placeholder={"Search icons..."}
                                    variant={"secondary"}
                                    size={"md"}
                                    startIcon={
                                        <IconComponent
                                            icon={<SearchIcon />}
                                            label={"Search icons"}
                                        />
                                    }
                                />
                            )}
                        </DelayedOnChange>
                        {actions ? <div>{actions}</div> : null}
                    </div>
                    <div className={"relative"}>
                        {isEmpty ? (
                            <div className={"pt-md text-neutral-strong"}>
                                <Text>{"No results found."}</Text>
                            </div>
                        ) : (
                            <List
                                className={"outline-none"}
                                rowRenderer={({ key, ...props }) => (
                                    <RowRenderer
                                        key={key}
                                        row={rows[props.index]}
                                        cellDecorator={cellDecorator}
                                        onIconClick={onChange}
                                        {...props}
                                    />
                                )}
                                width={size === ICON_PICKER_SIZE.SMALL ? 232 : 312}
                                height={size === ICON_PICKER_SIZE.SMALL ? 240 : 350}
                                rowCount={rowCount}
                                rowHeight={40}
                            />
                        )}
                    </div>
                </div>
            }
        />
    );
};
