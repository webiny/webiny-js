import React, { ReactElement } from "react";

import { i18n } from "@webiny/app/i18n";
import { ButtonIcon, ButtonPrimary, ButtonSecondary } from "@webiny/ui/Button";
import { ReactComponent as Add } from "@material-design-icons/svg/filled/add.svg";

import { Container } from "./styled";

const t = i18n.ns("app-page-builder/admin/views/pages/table/header/buttons/create");

interface Props {
    onCreatePage: (event?: React.SyntheticEvent) => void;
    onCreateFolder: (event?: React.SyntheticEvent) => void;
}

export const ButtonsCreate = ({ onCreateFolder, onCreatePage }: Props): ReactElement => {
    return (
        <Container>
            <ButtonSecondary data-testid="new-folder-button" onClick={onCreateFolder} small={true}>
                <ButtonIcon icon={<Add />} />
                {t`New Folder`}
            </ButtonSecondary>
            <ButtonPrimary
                data-testid="new-page-button"
                onClick={onCreatePage}
                flat={true}
                small={true}
            >
                <ButtonIcon icon={<Add />} />
                {t`New Page`}
            </ButtonPrimary>
        </Container>
    );
};
