import React from "react";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as RequestChangesIcon } from "~/admin/assets/rule-24px.svg";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { i18n } from "@webiny/app/i18n";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useMutation } from "@apollo/react-hooks";
import gql from "graphql-tag";
import usePermission from "~/hooks/usePermission";
import { PbPageData } from "~/types";
import { makeComposable } from "@webiny/app-admin";

const t = i18n.ns("app-page-builder/page-details/header/request-changes");

const REQUEST_CHANGES = gql`
    mutation PbPageRequestChanges($id: ID!) {
        pageBuilder {
            requestChanges(id: $id) {
                data {
                    id
                    status
                    locked
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

export interface RequestChangesProps {
    page: PbPageData;
}

const RequestChanges: React.FC<RequestChangesProps> = props => {
    const { page } = props;
    const { canRequestChange } = usePermission();
    const { showSnackbar } = useSnackbar();
    const [requestChanges] = useMutation(REQUEST_CHANGES);

    const { showConfirmation } = useConfirmationDialog({
        title: t`Request Changes`,
        message: (
            <p>
                {t`You are about to request changes to the {title} page. Are you sure you want to continue?`(
                    {
                        title: <strong>{page.title}</strong>
                    }
                )}
            </p>
        )
    });

    if (!canRequestChange()) {
        return null;
    }

    const buttonEnabled = page.status === "reviewRequested";

    return (
        <React.Fragment>
            <Tooltip content={t`Request Changes`} placement={"top"}>
                <IconButton
                    disabled={!buttonEnabled}
                    icon={<RequestChangesIcon />}
                    onClick={() =>
                        showConfirmation(async () => {
                            const response = await requestChanges({
                                variables: {
                                    id: page.id
                                }
                            });

                            const { error } = response.data.pageBuilder.requestChanges;
                            if (error) {
                                showSnackbar(error.message);
                            } else {
                                showSnackbar(t`Changes request sent successfully.`);
                            }
                        })
                    }
                />
            </Tooltip>
        </React.Fragment>
    );
};

export default makeComposable("RequestChanges", RequestChanges);
