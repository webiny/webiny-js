import React, { ReactElement } from "react";

import styled from "@emotion/styled";
import { i18n } from "@webiny/app/i18n";
import { ButtonPrimary, ButtonSecondary } from "@webiny/ui/Button";

const t = i18n.ns("app-page-builder/admin/views/pages/table/header");

interface Props {
    canCreate: boolean;
    onCreatePage: (event?: React.SyntheticEvent) => void;
    onCreateFolder: (event?: React.SyntheticEvent) => void;
}

const Container = styled("div")`
    padding: 8px 0;
    width: 100%;
    display: flex;
    justify-content: flex-end;
    background: var(--mdc-theme-surface);
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;

    > button {
        margin-right: 16px;
    }
`;

export const Header = ({ canCreate, onCreatePage, onCreateFolder }: Props): ReactElement => {
    if (canCreate) {
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
    }

    return <></>;
};
