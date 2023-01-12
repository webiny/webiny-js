import React, { ReactElement } from "react";

import { i18n } from "@webiny/app/i18n";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { ButtonDefault } from "@webiny/ui/Button";

import { Buttons, Icon } from "./styled";

const t = i18n.ns("app-page-builder/admin/views/pages/table/empty");

interface Props {
    onCreatePage: (event?: React.SyntheticEvent) => void;
    onCreateFolder: (event?: React.SyntheticEvent) => void;
    canCreate: boolean;
}

export const Empty = ({ onCreatePage, onCreateFolder, canCreate }: Props): ReactElement => {
    return (
        <EmptyView
            title={t`Nothing to show here, {message} `({
                message: canCreate
                    ? "navigate to a different folder or create a..."
                    : "click on the left side to navigate to a different folder."
            })}
            action={
                canCreate ? (
                    <Buttons>
                        <ButtonDefault data-testid="new-folder-button" onClick={onCreateFolder}>
                            <Icon /> {t`New Folder`}
                        </ButtonDefault>
                        <ButtonDefault data-testid="new-page-button" onClick={onCreatePage}>
                            <Icon /> {t`New Page`}
                        </ButtonDefault>
                    </Buttons>
                ) : (
                    <></>
                )
            }
        />
    );
};
