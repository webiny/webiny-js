import React, { useCallback } from "react";
import type { GridCellProps } from "react-virtualized";
import { Grid } from "react-virtualized";
import { Text } from "~/Text/index.js";
import { cn } from "~/utils.js";
import type { IconPickerFontAwesome } from "../../domains/index.js";
import { IconPickerIconFormatter } from "../../domains/index.js";
import { IconPickerIcon } from "./IconPickerIcon.js";

const COLUMN_COUNT = 5;
const GRID_WIDTH = 424;
const GRID_HEIGHT = 270;
const COLUMN_WIDTH = 80;
const ROW_HEIGHT = 80;

interface IconPickerGridProps {
    icons: IconPickerFontAwesome[];
    iconsLength: number;
    onIconSelect: (value: string) => void;
}

const IconPickerGrid = (props: IconPickerGridProps) => {
    const renderCell = useCallback(() => {
        return function renderCell({
            columnIndex,
            key,
            rowIndex,
            style
        }: GridCellProps): React.ReactNode {
            const item = props.icons[rowIndex * COLUMN_COUNT + columnIndex];
            if (!item) {
                return null;
            }

            return (
                <div
                    key={key}
                    style={style}
                    className={cn([
                        "flex flex-col justify-center items-center gap-sm",
                        "text-neutral-strong",
                        "hover:bg-neutral-dimmed hover:text-neutral-strong",
                        "px-xs-plus box-border rounded-xs cursor-pointer overflow-hidden",
                        "transition-colors duration-400 ease-out"
                    ])}
                    onClick={() => {
                        if (props.onIconSelect) {
                            props.onIconSelect(IconPickerIconFormatter.formatStringValue(item));
                        }
                    }}
                >
                    <IconPickerIcon
                        name={item.name}
                        prefix={item.prefix}
                        className={"size-lg"}
                    />
                    <Text
                        as={"div"}
                        size={"sm"}
                        className={"w-full truncate text-center text-neutral-muted"}
                    >
                        {item.name}
                    </Text>
                </div>
            );
        };
    }, [props.icons]);

    return (
        <div>
            {props.iconsLength === 0 ? (
                <div className={`px-sm-extra py-md text-neutral-strong`}>
                    <Text>{"No results found."}</Text>
                </div>
            ) : (
                <Grid
                    className={"px-sm-extra py-xs-plus outline-none"}
                    cellRenderer={renderCell()}
                    columnCount={COLUMN_COUNT}
                    columnWidth={COLUMN_WIDTH}
                    rowHeight={ROW_HEIGHT}
                    width={GRID_WIDTH}
                    height={GRID_HEIGHT}
                    rowCount={Math.ceil(props.iconsLength / COLUMN_COUNT)}
                />
            )}
        </div>
    );
};

export { IconPickerGrid, type IconPickerGridProps };
