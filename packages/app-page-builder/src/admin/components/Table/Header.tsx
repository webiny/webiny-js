import React from "react";

import styled from "@emotion/styled";
import { i18n } from "@webiny/app/i18n";
import { ButtonPrimary, ButtonSecondary } from "@webiny/ui/Button";

const t = i18n.ns("app-page-builder/admin/views/pages/table/header");

interface Props {
    onCreatePage: (event?: React.SyntheticEvent) => void;
    onCreateFolder: (event?: React.SyntheticEvent) => void;
}

const Container = styled("div")`
    display: flex;
    justify-content: flex-end;
    margin-bottom: 24px;

    > button {
        margin-left: 16px;
    }
`;

export const Header = ({ onCreatePage, onCreateFolder }: Props) => {
    return (
        <Container>
            <ButtonSecondary data-testid="new-folder-button" onClick={onCreateFolder}>
                {t`New Folder`}
            </ButtonSecondary>
            <ButtonPrimary data-testid="new-page-button" onClick={onCreatePage} flat={true}>
                {t`New Page`}
            </ButtonPrimary>
        </Container>
    );
};
