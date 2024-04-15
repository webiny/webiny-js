import React from "react";
import styled from "@emotion/styled";
import { AcoConfig } from "@webiny/app-aco";
import { ButtonSecondary } from "@webiny/ui/Button";

const { Table } = AcoConfig;
const useTableRow = Table.Column.createUseTableRow();

const AlignRight = styled.div`
    display: flex;
    justify-content: end;
`;

export const PreviewButton = () => {
    const { row } = useTableRow();

    const viewPage = () => {
        console.log(row);
    };

    return (
        <AlignRight>
            <ButtonSecondary onClick={viewPage}>View Page</ButtonSecondary>
        </AlignRight>
    );
};
