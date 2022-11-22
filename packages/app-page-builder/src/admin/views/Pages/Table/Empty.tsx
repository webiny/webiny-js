import React from "react";

import styled from "@emotion/styled";
import { ReactComponent as Add } from "@material-design-icons/svg/filled/add.svg";
import { i18n } from "@webiny/app/i18n";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { ButtonDefault } from "@webiny/ui/Button";

const t = i18n.ns("app-page-builder/admin/views/pages/table/empty");

interface EmptyPageDetailsProps {
    onCreatePage: (event?: React.SyntheticEvent) => void;
    onCreateFolder: (event?: React.SyntheticEvent) => void;
    canCreate: boolean;
}

const Buttons = styled("div")`
    > button {
        margin: 0 8px;
    }
`;

const Icon = styled(Add)`
    fill: var(--mdc-theme-primary);
    width: 18px;
    margin-right: 8px;
`;

export const Empty: React.FC<EmptyPageDetailsProps> = ({
    onCreatePage,
    onCreateFolder,
    canCreate
}) => {
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
