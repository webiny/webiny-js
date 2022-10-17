import React from "react";
import {
    DataTable as RmwcDataTable,
    DataTableContent as RmwcDataTableContent,
    DataTableHead as RmwcDataTableHead,
    DataTableRow as RmwcDataTableRow,
    DataTableHeadCell as RmwcDataTableHeadCell,
    DataTableBody as RmwcDataTableBody,
    DataTableCell as RmwcDataTableCell
} from "@rmwc/data-table";

import "@material/data-table/dist/mdc.data-table.css";
import "@rmwc/data-table/data-table.css";
import "@rmwc/icon/icon.css";

export const DataTableCell = (props: any) => {
    return <RmwcDataTableCell {...props}>{props.children}</RmwcDataTableCell>;
};

export const DataTableRow = (props: any) => {
    return <RmwcDataTableRow {...props}>{props.children}</RmwcDataTableRow>;
};

export const DataTableBody = (props: any) => {
    return <RmwcDataTableBody {...props}>{props.children}</RmwcDataTableBody>;
};

export const DataTableHeadCell = (props: any) => {
    return <RmwcDataTableHeadCell {...props}>{props.children}</RmwcDataTableHeadCell>;
};

export const DataTableHead = (props: any) => {
    return <RmwcDataTableHead {...props}>{props.children}</RmwcDataTableHead>;
};

export const DataTableContent = (props: any) => {
    return <RmwcDataTableContent {...props}>{props.children}</RmwcDataTableContent>;
};

export const DataTable = (props: any) => {
    return <RmwcDataTable {...props}>{props.children}</RmwcDataTable>;
};
