import React, { ReactElement } from "react";

import { ReactComponent as Add } from "@material-design-icons/svg/filled/add.svg";
import { i18n } from "@webiny/app/i18n";
import { ButtonIcon, ButtonPrimary, ButtonSecondary } from "@webiny/ui/Button";

import { Container } from "./styled";
import { Tooltip } from "@webiny/ui/Tooltip";

const t = i18n.ns("app-page-builder/admin/views/pages/table/header/buttons/create");

export interface ButtonsCreateProps {
    canCreatePage: boolean;
    canCreateFolder: boolean;
    onCreatePage: (event?: React.SyntheticEvent) => void;
    onCreateFolder: (event?: React.SyntheticEvent) => void;
}

export const ButtonsCreate = ({
    canCreatePage,
    canCreateFolder,
    onCreatePage,
    onCreateFolder
}: ButtonsCreateProps): ReactElement => {
    let newFolderButton = (
        <ButtonSecondary
            disabled={!canCreateFolder}
            data-testid="new-folder-button"
            onClick={onCreateFolder}
            small={true}
        >
            <ButtonIcon icon={<Add />} />
            {t`New Folder`}
        </ButtonSecondary>
    );

    if (!canCreateFolder) {
        newFolderButton = (
            <Tooltip content={`Cannot create folder because you're not an owner.`}>
                {newFolderButton}
            </Tooltip>
        );
    }

    let newPageButton = (
        <ButtonPrimary
            disabled={!canCreatePage}
            data-testid="new-page-button"
            onClick={onCreatePage}
            flat={true}
            small={true}
        >
            <ButtonIcon icon={<Add />} />
            {t`New Page`}
        </ButtonPrimary>
    );

    if (!canCreatePage) {
        newPageButton = (
            <Tooltip content={`Cannot create page because you're not an owner.`}>
                {newPageButton}
            </Tooltip>
        );
    }

    return (
        <Container>
            {newFolderButton}
            &nbsp;
            {newPageButton}
        </Container>
    );
};
