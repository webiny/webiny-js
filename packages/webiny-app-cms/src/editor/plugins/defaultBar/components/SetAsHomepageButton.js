// @flow
import React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import { getPage } from "webiny-app-cms/editor/selectors";
import { compose } from "recompose";
import { omit, isEqual } from "lodash";
import { withSnackbar } from "webiny-admin/components";
import { withRouter } from "react-router-dom";
import { MenuItem } from "webiny-ui/Menu";
import { withCmsSettings } from "webiny-app-cms/admin/components";
import { ListItemGraphic } from "webiny-ui/List";
import { Icon } from "webiny-ui/Icon";
import { ReactComponent as HomeIcon } from "webiny-app-cms/admin/assets/round-home-24px.svg";
import { Mutation } from "react-apollo";
import gql from "graphql-tag";
import { withConfirmation } from "webiny-ui/ConfirmationDialog";

const setHomePage = gql`
    mutation SetHomePage($id: ID!) {
        cms {
            pageBuilder {
                setHomePage(id: $id) {
                    error {
                        message
                    }
                }
            }
        }
    }
`;

const SetAsHomepageButton = ({ page, showConfirmation, showSnackbar, history }: Object) => {
    return (
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

                            const { error } = response.data.cms.pageBuilder.setHomePage;
                            if (error) {
                                return showSnackbar(error.message);
                            }

                            history.push(`/cms/pages?id=${page.id}`);

                            // Let's wait a bit, because we are also redirecting the user.
                            setTimeout(() => showSnackbar("New homepage set successfully!"), 500);
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
    );
};

export default compose(
    connect(
        state => ({ page: omit(getPage(state), ["content"]) }),
        null,
        null,
        { areStatePropsEqual: isEqual }
    ),
    withSnackbar(),
    withRouter,
    withConfirmation(() => ({
        message: (
            <span>
                You&#39;re about to set this page as your new homepage, are you sure you want to
                continue? Note that the page will automatically be published.
            </span>
        )
    })),
    withCmsSettings()
)(SetAsHomepageButton);
