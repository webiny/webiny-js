import React, { Fragment } from "react";
import { List } from "react-virtualized";
import groupBy from "lodash/groupBy";

import { Tab } from "@webiny/ui/Tabs";
import { Typography } from "@webiny/ui/Typography";
import { DelayedOnChange } from "@webiny/ui/DelayedOnChange";
import { Input } from "@webiny/ui/Input";
import { makeDecoratable } from "@webiny/react-composition";

import { IconProvider, IconRenderer } from "./IconRenderer";
import {
    Row,
    Cell,
    CategoryLabel,
    TabContentWrapper,
    ListWrapper,
    NoResultsWrapper,
    InputsWrapper
} from "./IconPicker.styles";
import { useIconPicker } from "./IconPickerPresenterProvider";
import { useIconType } from "./config/IconType";
import { Icon, IconPickerGridRow, ICON_PICKER_SIZE } from "./types";

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
            <Row style={style}>
                <CategoryLabel>{row.name}</CategoryLabel>
            </Row>
        );
    }

    return (
        <Row style={style}>
            {row.icons.map((item, itemKey) => (
                <Fragment key={itemKey}>
                    {cellDecorator(
                        <Cell
                            key={itemKey}
                            isActive={item.name === value?.name}
                            onClick={() => onIconClick(item)}
                        >
                            <IconProvider icon={item}>
                                <IconRenderer />
                            </IconProvider>
                        </Cell>
                    )}
                </Fragment>
            ))}
        </Row>
    );
};

interface CellDecorator {
    (cell: React.ReactElement): React.ReactElement;
}

const noopDecorator: CellDecorator = cell => cell;

export interface IconPickerTabProps {
    label: string;
    onChange: (icon: Icon) => void;
    actions?: React.ReactElement;
    cellDecorator?: CellDecorator;
}

export const IconPickerTab = ({
    label,
    actions,
    onChange,
    cellDecorator = noopDecorator
}: IconPickerTabProps) => {
    const { type } = useIconType();
    const { isEmpty, rowCount, rows } = useIconTypeRows(type);
    const presenter = useIconPicker();
    const size = presenter.vm.size;

    return (
        <Tab label={label}>
            <TabContentWrapper size={size}>
                <InputsWrapper>
                    <DelayedOnChange
                        value={presenter.vm.filter}
                        onChange={value => presenter.setFilter(value)}
                    >
                        {({ value, onChange }) => (
                            <Input
                                value={value}
                                onChange={onChange}
                                placeholder={"Search icons..."}
                            />
                        )}
                    </DelayedOnChange>
                    {actions ? actions : null}
                </InputsWrapper>
                <ListWrapper>
                    {isEmpty ? (
                        <NoResultsWrapper>
                            <Typography use="body1">No results found.</Typography>
                        </NoResultsWrapper>
                    ) : (
                        <List
                            rowRenderer={({ key, ...props }) => (
                                <RowRenderer
                                    key={key}
                                    row={rows[props.index]}
                                    cellDecorator={cellDecorator}
                                    onIconClick={onChange}
                                    {...props}
                                />
                            )}
                            height={size === ICON_PICKER_SIZE.SMALL ? 250 : 320}
                            rowCount={rowCount}
                            rowHeight={40}
                            width={size === ICON_PICKER_SIZE.SMALL ? 255 : 340}
                        />
                    )}
                </ListWrapper>
            </TabContentWrapper>
        </Tab>
    );
};
