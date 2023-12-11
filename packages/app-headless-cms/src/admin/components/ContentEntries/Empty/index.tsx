import React from "react";
import { ReactComponent as SearchIcon } from "@material-design-icons/svg/outlined/search.svg";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { i18n } from "@webiny/app/i18n";
import { ButtonDefault } from "@webiny/ui/Button";
import { Buttons, Icon } from "./styled";
import { Tooltip } from "@webiny/ui/Tooltip";

const t = i18n.ns("app-headless-cms/admin/components/content-entries/empty");

interface EmptyProps {
    isSearch: boolean;
    onCreateEntry: (event: React.SyntheticEvent) => void;
    onCreateFolder: (event: React.SyntheticEvent) => void;
    canCreateContent: boolean;
    canCreateFolder: boolean;
}

export const Empty = ({
    isSearch,
    onCreateEntry,
    onCreateFolder,
    canCreateContent,
    canCreateFolder
}: EmptyProps) => {
    if (isSearch) {
        return <EmptyView icon={<SearchIcon />} title={t`No results found.`} action={null} />;
    }

    let createEntryButton = (
        <ButtonDefault
            data-testid="new-entry-button"
            onClick={onCreateEntry}
            disabled={!canCreateContent}
        >
            <Icon /> {t`New Entry`}
        </ButtonDefault>
    );

    if (!canCreateContent) {
        createEntryButton = (
            <Tooltip
                content={`Cannot create entry because you're not an owner.`}
                placement={"bottom"}
            >
                {createEntryButton}
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
                    {createEntryButton}
                </Buttons>
            }
        />
    );
};
