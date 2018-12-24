// @flow
import React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import { ConfirmationDialog } from "webiny-ui/ConfirmationDialog";
import { ButtonPrimary } from "webiny-ui/Button";
import { getPage } from "webiny-app-cms/editor/selectors";
import { compose } from "recompose";
import { omit } from "lodash";
import { Mutation } from "react-apollo";
import { withSnackbar } from "webiny-app-admin/components";
import { withRouter } from "webiny-app/components";
import { publishRevision } from "./PublishPageButton/graphql";

const PublishPageButton = ({ page, showSnackbar, router }) => {
    return (
        <ConfirmationDialog
            title="Publish page"
            message="You are about to publish this page, are you sure want to continue?"
        >
            {({ showConfirmation }) => (
                <Mutation mutation={publishRevision}>
                    {update => (
                        <ButtonPrimary
                            onClick={async () => {
                                showConfirmation(async () => {
                                    const response = await update({
                                        variables: {
                                            id: page.id
                                        }
                                    });

                                    const { error } = response.data.cms.publishRevision;
                                    if (error) {
                                        return showSnackbar(error.message);
                                    }

                                    await router.goToRoute({
                                        name: "Cms.Pages",
                                        params: { id: page.id }
                                    });

                                    // Let's wait a bit, because we are also redirecting the user.
                                    setTimeout(() => {
                                        showSnackbar("Your page was published successfully!");
                                    }, 500);
                                });
                            }}
                        >
                            Publish
                        </ButtonPrimary>
                    )}
                </Mutation>
            )}
        </ConfirmationDialog>
    );
};

export default compose(
    connect(state => ({ page: omit(getPage(state), ["content"]) })),
    withSnackbar(),
    withRouter()
)(PublishPageButton);
