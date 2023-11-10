import React, { ReactElement } from "react";

import { ReactComponent as SearchIcon } from "@material-design-icons/svg/outlined/search.svg";
import { i18n } from "@webiny/app/i18n";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { ButtonDefault } from "@webiny/ui/Button";

import { Buttons, Icon } from "./styled";
import { Tooltip } from "@webiny/ui/Tooltip";

const t = i18n.ns("app-page-builder/admin/views/pages/table/empty");

interface Props {
    isSearch: boolean;
    onCreatePage: (event?: React.SyntheticEvent) => void;
    onCreateFolder: (event?: React.SyntheticEvent) => void;
    canCreateContent: boolean;
    canCreateFolder: boolean;
}

export const Empty = ({
    isSearch,
    onCreatePage,
    onCreateFolder,
    canCreateContent,
    canCreateFolder
}: Props): ReactElement => {
    if (isSearch) {
        return <EmptyView icon={<SearchIcon />} title={t`No results found.`} action={null} />;
    }

    let createPageButton = (
        <ButtonDefault
            data-testid="new-page-button"
            onClick={onCreatePage}
            disabled={!canCreateContent}
        >
            <Icon /> {t`New Page`}
        </ButtonDefault>
    );

    if (!canCreateContent) {
        createPageButton = (
            <Tooltip
                content={`Cannot create page because you're not an owner.`}
                placement={"bottom"}
            >
                {createPageButton}
            </Tooltip>
        );
    }

    let createFolderButton = (
        <ButtonDefault
            data-testid="new-folder-button"
            onClick={onCreateFolder}
            disabled={!canCreateFolder}
        >
            <Icon /> {t`New Folder`}
        </ButtonDefault>
    );

    if (!canCreateFolder) {
        createFolderButton = (
            <Tooltip
                content={`Cannot create folder because you're not an owner.`}
                placement={"bottom"}
            >
                {createFolderButton}
            </Tooltip>
        );
    }

    return (
        <EmptyView
            title={t`Nothing to show here, {message} `({
                message: canCreateContent
                    ? "navigate to a different folder or create a..."
                    : "click on the left side to navigate to a different folder."
            })}
            action={
                <Buttons>
                    {createFolderButton}
                    &nbsp;
                    {createPageButton}
                </Buttons>
            }
        />
    );
};
