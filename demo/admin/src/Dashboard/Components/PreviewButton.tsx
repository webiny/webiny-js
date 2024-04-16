import React from "react";
import styled from "@emotion/styled";
import { AcoConfig } from "@webiny/app-aco";
import { ButtonSecondary } from "@webiny/ui/Button";
import { observer } from "mobx-react-lite";
import { useDashboardPresenter } from "../DashboardPresenterProvider";
import { ReadonlyArticle } from "@demo/shared";

const { Table } = AcoConfig;
const useTableRow = Table.Column.createUseTableRow<ReadonlyArticle>();

const AlignRight = styled.div`
    display: flex;
    justify-content: end;
`;

export const PreviewButton = observer(() => {
    const { presenter } = useDashboardPresenter();
    const { row } = useTableRow();

    const viewPage = () => {
        presenter.showArticlePreview(row);
    };

    return (
        <AlignRight>
            <ButtonSecondary onClick={viewPage}>View Page</ButtonSecondary>
        </AlignRight>
    );
});
