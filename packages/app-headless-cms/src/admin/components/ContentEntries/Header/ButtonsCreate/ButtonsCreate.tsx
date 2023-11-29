import React from "react";
import { ReactComponent as Add } from "@material-design-icons/svg/filled/add.svg";
import { i18n } from "@webiny/app/i18n";
import { ButtonIcon, ButtonPrimary, ButtonSecondary } from "@webiny/ui/Button";
import { Container } from "./styled";
import { Tooltip } from "@webiny/ui/Tooltip";

const t = i18n.ns("app-headless-cms/admin/components/content-entries/header/buttons/create");

interface Props {
    onCreateEntry: (event: React.SyntheticEvent) => void;
    onCreateFolder: (event: React.SyntheticEvent) => void;
    canCreateFolder: boolean;
    canCreateContent: boolean;
}

export const ButtonsCreate: React.VFC<Props> = ({
    onCreateFolder,
    onCreateEntry,
    canCreateContent,
    canCreateFolder
}) => {
    let newFolderButton = (
        <ButtonSecondary
            data-testid="new-folder-button"
            onClick={onCreateFolder}
            small={true}
            disabled={!canCreateFolder}
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

    let newEntryButton = (
        <ButtonPrimary
            data-testid="new-entry-button"
            onClick={onCreateEntry}
            flat={true}
            small={true}
            disabled={!canCreateContent}
        >
            <ButtonIcon icon={<Add />} />
            {t`New Entry`}
        </ButtonPrimary>
    );

    if (!canCreateContent) {
        newEntryButton = (
            <Tooltip content={`Cannot create entry because you're not an owner.`}>
                {newEntryButton}
            </Tooltip>
        );
    }

    return (
        <Container>
            {newFolderButton}
            &nbsp;
            {newEntryButton}
        </Container>
    );
};
