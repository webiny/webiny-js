import React, { useMemo } from "react";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as RequestChangesIcon } from "@webiny/app-page-builder/admin/assets/rate_changes-24px.svg";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { i18n } from "@webiny/app/i18n";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useMutation } from "react-apollo";
import gql from "graphql-tag";
import { useSecurity } from "@webiny/app-security";

const t = i18n.ns("app-headless-cms/app-page-builder/page-details/header/request Changes");

const REQUEST_CHANGES = gql`
    mutation updateMenu($id: ID!) {
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

const RequestChanges = props => {
    const { identity } = useSecurity();
    const { page } = props;

    const { showSnackbar } = useSnackbar();
    const [requestChanges] = useMutation(REQUEST_CHANGES);

    const { showConfirmation } = useConfirmationDialog({
        title: t`Request Changes`,
        message: (
            <p>
                {t`You are about to request changes for {title} page. Are you sure you want to continue?`(
                    {
                        title: <strong>{page.title}</strong>
                    }
                )}
            </p>
        )
    });

    const pbPagePermission = useMemo(() => identity.getPermission("pb.page"), []);
    if (!pbPagePermission) {
        return null;
    }

    if (pbPagePermission.own && page?.createdBy?.id !== identity.id) {
        return null;
    }

    if (typeof pbPagePermission.rcpu === "string" && !pbPagePermission.rcpu.includes("c")) {
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

export default RequestChanges;
