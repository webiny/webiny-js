import React, { ReactNode, useCallback, useMemo } from "react";
import { ReactComponent as SettingsIcon } from "@material-design-icons/svg/outlined/settings.svg";
import { Column } from "@tanstack/react-table";
import { IconButton } from "~/Button";
import { Checkbox } from "~/Checkbox";
import { Menu, MenuDivider } from "~/Menu";
import { ColumnsVisibilityMenuHeader, ColumnsVisibilityMenuItem } from "~/DataTable/styled";

interface ColumnsVisibilityProps<T> {
    columns: Column<T>[];
}

interface Option {
    id: string;
    header: ReactNode;
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
        <Menu handle={<IconButton icon={<SettingsIcon />} />}>
            <ColumnsVisibilityMenuHeader use={"subtitle2"} tag={"h6"}>
                {"Toggle column visibility"}
            </ColumnsVisibilityMenuHeader>
            <MenuDivider />
            {options.map(option => {
                return (
                    <ColumnsVisibilityMenuItem key={option.id}>
                        <Checkbox
                            label={option.header}
                            onChange={option.onChange}
                            value={option.getValue()}
                        />
                    </ColumnsVisibilityMenuItem>
                );
            })}
        </Menu>
    );
};
