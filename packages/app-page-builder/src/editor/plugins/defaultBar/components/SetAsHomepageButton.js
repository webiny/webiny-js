// @flow
import React from "react";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { getPage } from "@webiny/app-page-builder/editor/selectors";
import { omit, isEqual } from "lodash";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import useReactRouter from "use-react-router";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as HomeIcon } from "@webiny/app-page-builder/admin/assets/round-home-24px.svg";
import { Mutation } from "react-apollo";
import gql from "graphql-tag";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";

const setHomePage = gql`
    mutation SetHomePage($id: ID!) {
        pageBuilder {
            setHomePage(id: $id) {
                error {
                    message
                }
            }
        }
    }
`;

const SetAsHomepageButton = ({ page }: Object) => {
    const { history } = useReactRouter();
    const { showSnackbar } = useSnackbar();

    return (
        <ConfirmationDialog
            message={
                <span>
                    You&#39;re about to set this page as your new homepage, are you sure you want to
                    continue? Note that the page will automatically be published.
                </span>
            }
        >
            {({ showConfirmation }) => (
                <Mutation mutation={setHomePage}>
                    {update => (
                        <MenuItem
                            onClick={() => {
                                showConfirmation(async () => {
                                    const response = await update({
                                        variables: {
                                            id: page.id
                                        }
                                    });

                                    const { error } = response.data.pageBuilder.setHomePage;
                                    if (error) {
                                        return showSnackbar(error.message);
                                    }

                                    history.push(`/page-builder/pages?id=${page.id}`);

                                    // Let's wait a bit, because we are also redirecting the user.
                                    setTimeout(
                                        () => showSnackbar("New homepage set successfully!"),
                                        500
                                    );
                                });
                            }}
                        >
                            <ListItemGraphic>
                                <Icon icon={<HomeIcon />} />
                            </ListItemGraphic>
                            Set as homepage
                        </MenuItem>
                    )}
                </Mutation>
            )}
        </ConfirmationDialog>
    );
};

export default connect(
    state => ({ page: omit(getPage(state), ["content"]) }),
    null,
    null,
    { areStatePropsEqual: isEqual }
)(SetAsHomepageButton);
