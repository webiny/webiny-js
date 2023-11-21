import React from "react";
import { ReactComponent as Add } from "@material-design-icons/svg/filled/add.svg";
import { i18n } from "@webiny/app/i18n";
import { ButtonIcon, ButtonPrimary, ButtonSecondary } from "@webiny/ui/Button";
import { Container } from "./styled";

const t = i18n.ns("app-headless-cms/admin/components/content-entries/header/buttons/create");

interface Props {
    onCreateEntry: (event: React.SyntheticEvent) => void;
    onCreateFolder: (event: React.SyntheticEvent) => void;
}

export const ButtonsCreate: React.VFC<Props> = ({ onCreateFolder, onCreateEntry }) => {
    return (
        <Container>
            <ButtonSecondary data-testid="new-folder-button" onClick={onCreateFolder} small={true}>
                <ButtonIcon icon={<Add />} />
                {t`New Folder`}
            </ButtonSecondary>
            <ButtonPrimary
                data-testid="new-entry-button"
                onClick={onCreateEntry}
                flat={true}
                small={true}
            >
                <ButtonIcon icon={<Add />} />
                {t`New Entry`}
            </ButtonPrimary>
        </Container>
    );
};
