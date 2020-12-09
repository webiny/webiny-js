import React, { useMemo } from "react";
import { pageAtom } from "@webiny/app-page-builder/editor/recoil/modules";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Mutation } from "react-apollo";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useRouter } from "@webiny/react-router";
import { useRecoilValue } from "recoil";
import { PUBLISH_PAGE } from "./PublishPageButton/graphql";
import { useSecurity } from "@webiny/app-security";

const PublishPageButton: React.FunctionComponent = () => {
    const { identity } = useSecurity();
    const page = useRecoilValue(pageAtom);
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();

    const pbPagePermission = useMemo(() => identity.getPermission("pb.page"), []);
    if (!pbPagePermission) {
        return null;
    }

    if (pbPagePermission.own && page.createdBy.id !== identity.login) {
        return null;
    }

    if (typeof pbPagePermission.rcpu === "string" && !pbPagePermission.rcpu.includes("p")) {
        return null;
    }

    return (
        <ConfirmationDialog
            data-testid={"pb-editor-publish-confirmation-dialog"}
            title="Publish page"
            message="You are about to publish this page, are you sure want to continue?"
        >
            {({ showConfirmation }) => (
                <Mutation mutation={PUBLISH_PAGE} refetchQueries={["PbListPages"]}>
                    {update => (
                        <ButtonPrimary
                            onClick={async () => {
                                showConfirmation(async () => {
                                    const response = await update({
                                        variables: {
                                            id: page.id
                                        }
                                    });

                                    const { error } = response.data.pageBuilder.publishPage;
                                    if (error) {
                                        return showSnackbar(error.message);
                                    }

                                    history.push(
                                        `/page-builder/pages?id=${encodeURIComponent(page.id)}`
                                    );

                                    // Let's wait a bit, because we are also redirecting the user.
                                    setTimeout(() => {
                                        showSnackbar("Your page was published successfully!");
                                    }, 500);
                                });
                            }}
                        >
                            {page.version > 1 ? "Publish changes" : "Publish"}
                        </ButtonPrimary>
                    )}
                </Mutation>
            )}
        </ConfirmationDialog>
    );
};

export default PublishPageButton;
