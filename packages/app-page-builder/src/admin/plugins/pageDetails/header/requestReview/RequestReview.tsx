import React from "react";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as RequestReviewIcon } from "~/admin/assets/emoji_people-24px.svg";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { i18n } from "@webiny/app/i18n";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useMutation } from "@apollo/react-hooks";
import gql from "graphql-tag";
import usePermission from "~/hooks/usePermission";
import { PbPageData } from "~/types";
import { makeComposable } from "@webiny/app-admin";

const t = i18n.ns("app-page-builder/page-details/header/request-review");

const REQUEST_REVIEW = gql`
    mutation PbPageRequestReview($id: ID!) {
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

export interface RequestReviewProps {
    page: PbPageData;
}

const RequestReview: React.FC<RequestReviewProps> = props => {
    const { page } = props;

    const { canRequestReview } = usePermission();
    const { showSnackbar } = useSnackbar();
    const [requestReview] = useMutation(REQUEST_REVIEW);

    const { showConfirmation } = useConfirmationDialog({
        title: t`Request Review`,
        message: (
            <p>
                {t`You are about to request review of the {title} page. Are you sure you want to continue?`(
                    {
                        title: <strong>{page.title}</strong>
                    }
                )}
            </p>
        )
    });

    if (!canRequestReview()) {
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

export default makeComposable("RequestReview", RequestReview);
