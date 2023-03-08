import styled from "@emotion/styled";

import { DataTable as RmwcDataTable, DataTableProps } from "@rmwc/data-table";

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
