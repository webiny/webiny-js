import React, { useMemo } from "react";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as PublishIcon } from "@webiny/app-page-builder/admin/assets/round-publish-24px.svg";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { i18n } from "@webiny/app/i18n";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useMutation } from "react-apollo";
import gql from "graphql-tag";
import { useSecurity } from "@webiny/app-security";

const t = i18n.ns("app-headless-cms/app-page-builder/page-details/header/publish");

const PUBLISH_PAGE = gql`
    mutation updateMenu($id: ID!) {
        pageBuilder {
            publishPage(id: $id) {
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

const PublishRevision = props => {
    const { identity } = useSecurity();
    const { page } = props;

    const { showSnackbar } = useSnackbar();

    const [publishPage] = useMutation(PUBLISH_PAGE);

    const { showConfirmation } = useConfirmationDialog({
        title: t`Publish page`,
        message: (
            <p>
                {t`You are about to publish {title} page. Are you sure you want to continue?`({
                    title: <strong>{page.title}</strong>
                })}
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

    if (typeof pbPagePermission.rcpu === "string" && !pbPagePermission.rcpu.includes("p")) {
        return null;
    }

    const buttonDisabled = page.status === "published";

    return (
        <React.Fragment>
            <Tooltip content={t`Publish`} placement={"top"}>
                <IconButton
                    disabled={buttonDisabled}
                    icon={<PublishIcon />}
                    onClick={() =>
                        showConfirmation(async () => {
                            const response = await publishPage({
                                variables: {
                                    id: page.id
                                }
                            });

                            const { error } = response.data.pageBuilder.publishPage;
                            if (error) {
                                showSnackbar(error.message);
                            } else {
                                showSnackbar(t`Page published successfully.`);
                            }
                        })
                    }
                />
            </Tooltip>
        </React.Fragment>
    );
};

export default PublishRevision;
