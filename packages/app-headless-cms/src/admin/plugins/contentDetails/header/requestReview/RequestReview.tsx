import React, { useMemo } from "react";
import gql from "graphql-tag";
import { useMutation } from "react-apollo";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { i18n } from "@webiny/app/i18n";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useSecurity } from "@webiny/app-security";
import { ReactComponent as RequestReviewIcon } from "../../../../icons/emoji_people-24px.svg";

const t = i18n.ns("app-headless-cms/app-page-builder/page-details/header/request Review");

const REQUEST_REVIEW = gql`
    mutation updateMenu($id: ID!) {
        pageBuilder {
            requestReview(id: $id) {
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

const RequestReview = props => {
    const { identity } = useSecurity();
    const { page } = props;

    const { showSnackbar } = useSnackbar();
    const [requestReview] = useMutation(REQUEST_REVIEW);

    const { showConfirmation } = useConfirmationDialog({
        title: t`Request Review`,
        message: (
            <p>
                {t`You are about to request review for {title} page. Are you sure you want to continue?`(
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

    if (pbPagePermission.own && page?.createdBy?.id !== identity.login) {
        return null;
    }

    if (typeof pbPagePermission.rcpu === "string" && !pbPagePermission.rcpu.includes("r")) {
        return null;
    }

    const buttonEnabled = page.status === "draft" || page.status === "changesRequested";

    return (
        <React.Fragment>
            <Tooltip content={t`Request Review`} placement={"top"}>
                <IconButton
                    disabled={!buttonEnabled}
                    icon={<RequestReviewIcon />}
                    onClick={() =>
                        showConfirmation(async () => {
                            const response = await requestReview({
                                variables: {
                                    id: page.id
                                }
                            });

                            const { error } = response.data.pageBuilder.requestReview;
                            if (error) {
                                showSnackbar(error.message);
                            } else {
                                showSnackbar(t`Review request sent successfully.`);
                            }
                        })
                    }
                />
            </Tooltip>
        </React.Fragment>
    );
};

export default RequestReview;
