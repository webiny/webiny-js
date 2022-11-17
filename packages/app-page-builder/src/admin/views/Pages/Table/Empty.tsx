import React from "react";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { ButtonDefault, ButtonIcon } from "@webiny/ui/Button";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-page-builder/admin/views/pages/table/empty");

interface EmptyPageDetailsProps {
    onCreatePage: (event?: React.SyntheticEvent) => void;
    canCreate: boolean;
}

export const Empty: React.FC<EmptyPageDetailsProps> = ({ onCreatePage, canCreate }) => {
    return (
        <EmptyView
            title={t`No entries found here, click on the left side to navigate to a different folder {message} `(
                {
                    message: canCreate ? "or create a..." : ""
                }
            )}
            action={
                canCreate ? (
                    <ButtonDefault data-testid="new-record-button" onClick={onCreatePage}>
                        <ButtonIcon icon={<AddIcon />} /> {t`New Page`}
                    </ButtonDefault>
                ) : (
                    <></>
                )
            }
        />
    );
};
