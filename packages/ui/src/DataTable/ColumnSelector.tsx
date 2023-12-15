import React, { ReactNode, useMemo } from "react";
import { ReactComponent as SettingsIcon } from "@material-design-icons/svg/outlined/settings.svg";
import { IconButton } from "~/Button";
import { Menu, MenuDivider } from "~/Menu";
import { Column, flexRender, Header } from "@tanstack/react-table";
import { Checkbox } from "~/Checkbox";
import { ColumnVisibilityMenuHeader, ColumnVisibilityMenuItem } from "~/DataTable/styled";

interface ColumnSelectorProps<T> {
    columns: Column<T>[];
    headers: Header<T, unknown>[];
}

interface Option {
    id: string;
    header: ReactNode;
    onChange: (value?: boolean | undefined) => void;
    getValue: () => boolean;
}

export const ColumnSelector = <T,>(props: ColumnSelectorProps<T>) => {
    const options: Option[] = useMemo(() => {
        return props.columns
            .filter(column => column.getCanHide())
            .map(column => {
                const header = props.headers.find(header => header.id === column.id);

                return {
                    id: column.id,
                    header: column.id, // header ? flexRender(column.columnDef.header, header.getContext()) : "",
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
            <ColumnVisibilityMenuHeader use={"subtitle2"} tag={"h6"}>
                {"Toggle column visibility"}
            </ColumnVisibilityMenuHeader>
            <MenuDivider />
            {options.map(option => {
                return (
                    <ColumnVisibilityMenuItem key={option.id}>
                        <Checkbox
                            label={option.header}
                            onChange={option.onChange}
                            value={option.getValue()}
                        />
                    </ColumnVisibilityMenuItem>
                );
            })}
        </Menu>
    );
};
