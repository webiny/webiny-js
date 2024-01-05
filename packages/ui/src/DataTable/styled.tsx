import { CSSProperties } from "react";
import styled from "@emotion/styled";

import { ReactComponent as ArrowDown } from "@material-design-icons/svg/outlined/arrow_downward.svg";
import {
    DataTable as RmwcDataTable,
    DataTableCell as RmwcDataTableCell,
    DataTableHeadCell as RmwcDataTableHeadCell,
    DataTableProps,
    DataTableHeadCellProps,
    DataTableCellProps
} from "@rmwc/data-table";
import { ColumnDirectionProps } from "~/DataTable/ColumnDirection";
import { Typography } from "~/Typography";

interface TableProps extends DataTableProps {
    bordered?: boolean;
}

export const Table = styled(RmwcDataTable)<TableProps>`
    overflow-y: hidden;
    overflow-x: scroll;
    max-width: 100%;
    display: block !important;
    border-width: ${props => (props.bordered ? "1px" : "0px")};

    th,
    td {
        vertical-align: middle;
    }
`;

interface ResizerProps {
    isResizing: boolean;
}

export const Resizer = styled("div")<ResizerProps>`
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
    width: 4px;
    background: ${props =>
        props.isResizing
            ? "var(--mdc-theme-text-hint-on-light)"
            : "var(--mdc-theme-on-background)"};
    cursor: col-resize;
    user-select: none;
    touch-action: none;
    opacity: ${props => (props.isResizing ? 1 : 0)};
`;

interface TableHeadCell extends DataTableHeadCellProps {
    colSpan: number;
    style?: CSSProperties;
}

export const TableHeadCell = styled(RmwcDataTableHeadCell)<TableHeadCell>`
    position: relative;
    width: auto;

    &:hover ${Resizer} {
        opacity: 1;
    }
`;

interface DataTableCell extends DataTableCellProps {
    style?: CSSProperties;
}

export const DataTableCell = styled(RmwcDataTableCell)<DataTableCell>`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

interface ColumnHeaderWrapperProps {
    sortable: boolean;
    isLastCell: boolean;
}

export const ColumnHeaderWrapper = styled("div")<ColumnHeaderWrapperProps>`
    cursor: ${props => (props.sortable ? "pointer" : "cursor")};
    display: flex;
    align-items: center;
    justify-content: ${props => (props.isLastCell ? "flex-end" : "start")};
`;

export const ColumnDirectionWrapper = styled("span")`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 16px;
    width: 16px;
    margin: 0 0 0 4px;
`;

export const ColumnDirectionIcon = styled(ArrowDown)<ColumnDirectionProps>`
    transform: ${props => (props.direction === "asc" ? "rotate(180deg)" : "rotate(0deg)")};
`;

export const ColumnsVisibilityMenuHeader = styled(Typography)`
    padding: 4px 16px;
    font-weight: 600;
`;

export const ColumnsVisibilityMenuItem = styled("div")`
    padding: 0 16px;
`;
