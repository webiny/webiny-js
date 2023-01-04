import styled from "@emotion/styled";

import { DataTable as RmwcDataTable, DataTableProps } from "@rmwc/data-table";

export const Table = styled(RmwcDataTable)<DataTableProps>`
    width: 100%;

    th,
    td {
        vertical-align: middle;
    }

    .datatable-select-column {
        width: 56px;
    }
`;
