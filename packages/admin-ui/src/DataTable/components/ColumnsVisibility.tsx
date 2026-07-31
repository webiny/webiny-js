import React, { useCallback, useMemo } from "react";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import type { Column } from "@tanstack/react-table";
import { IconButton } from "~/Button/index.js";
import { Checkbox } from "~/Checkbox/index.js";
import { DropdownMenu } from "~/DropdownMenu/index.js";

interface ColumnsVisibilityProps<T> {
    columns: Column<T>[];
}

interface Option {
    id: string;
    header: string;
    onChange: (value?: boolean | undefined) => void;
    getValue: () => boolean;
}

export const ColumnsVisibility = <T,>(props: ColumnsVisibilityProps<T>) => {
    /**
     * `@tanstack/react-table` does not have a simple method to return the header component.
     * The only possible way is to use `flexRenderer`, but this is not working with the current implementation
     * since we don't have access to the header context.
     */
    const getHeaderName = useCallback((column: Column<T>) => {
        const { header } = column.columnDef;

        if (typeof header === "string") {
            return header;
        }

        if (typeof header === "function") {
            // @ts-expect-error
            return header();
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
                    onChange: column.toggleVisibility,
                    getValue: column.getIsVisible
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
