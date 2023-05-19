import styled from "@emotion/styled";

import { ReactComponent as ArrowDown } from "@material-design-icons/svg/outlined/arrow_downward.svg";
import { DataTable as RmwcDataTable, DataTableProps } from "@rmwc/data-table";
import { ColumnDirectionProps } from "~/DataTable/DataTable";

interface TableProps extends DataTableProps {
    bordered?: boolean;
}

export const Table = styled(RmwcDataTable)<TableProps>`
    width: 100%;
    border-width: ${props => (props.bordered ? "1px" : "0px")};

    th,
    td {
        vertical-align: middle;
    }

    .datatable-select-column {
        width: 56px;
    }
`;

interface ColumnHeaderWrapperProps {
    sortable: boolean;
}

export const ColumnHeaderWrapper = styled("div")<ColumnHeaderWrapperProps>`
    cursor: ${props => (props.sortable ? "pointer" : "cursort")};
    display: flex;
    align-items: center;
    justify-content: start;
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
