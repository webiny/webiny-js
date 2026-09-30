import React, { useCallback, useMemo } from "react";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import type { Column, RowData } from "@tanstack/react-table";
import { IconButton } from "~/Button/index.js";
import { Checkbox } from "~/Checkbox/index.js";
import { DropdownMenu } from "~/DropdownMenu/index.js";
import type { Features } from "../DataTable.js";

interface ColumnsVisibilityProps<T extends RowData> {
    columns: Column<Features, T>[];
}

interface Option {
    id: string;
    header: string;
    onChange: (value?: boolean | undefined) => void;
    getValue: () => boolean;
}

export const ColumnsVisibility = <T extends RowData>(props: ColumnsVisibilityProps<T>) => {
    /**
     * `@tanstack/react-table` does not have a simple method to return the header component.
     * The only possible way is to use `flexRenderer`, but this is not working with the current implementation
     * since we don't have access to the header context.
     */
    const getHeaderName = useCallback((column: Column<Features, T>) => {
        const { header } = column.columnDef;

        if (typeof header === "string") {
            return header;
        }

        if (typeof header === "function") {
            const flatHeader = column.table.getFlatHeaders().find(h => h.column.id === column.id);

            if (flatHeader) {
                return header(flatHeader.getContext());
            }
        }

        return column.id;
    }, []);

    const options: Option[] = useMemo(() => {
        return props.columns
            .filter(column => column.getCanHide())
            .map(column => {
                return {
                    id: column.id,
                    header: getHeaderName(column),
                    /**
                     * `@tanstack/react-table` v9 puts these on the column prototype, so they
                     * read their column off `this`. They must stay attached to the column.
                     */
                    onChange: value => column.toggleVisibility(value),
                    getValue: () => column.getIsVisible()
                };
            });
    }, [props.columns]);

    if (options.length === 0) {
        return null;
    }

    return (
        <DropdownMenu
            trigger={<IconButton icon={<SettingsIcon />} variant={"ghost"} size={"xs"} />}
        >
            <DropdownMenu.Label text={"Display columns"} />
            {options.map(option => {
                return (
                    <DropdownMenu.Item
                        key={option.id}
                        preventClose
                        text={
                            <Checkbox
                                label={option.header}
                                onChange={option.onChange}
                                checked={option.getValue()}
                            />
                        }
                    />
                );
            })}
        </DropdownMenu>
    );
};
