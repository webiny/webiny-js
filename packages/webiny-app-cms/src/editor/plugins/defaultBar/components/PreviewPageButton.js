// @flow
import React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import { ButtonSecondary } from "webiny-ui/Button";
import { getPage } from "webiny-app-cms/editor/selectors";
import { compose } from "recompose";
import { omit } from "lodash";
import { withSnackbar } from "webiny-admin/components";
import { withRouter } from "webiny-app/components";
import { Query } from "react-apollo";
import gql from "graphql-tag";
import { get, trimEnd } from "lodash";

const createPreviewUrl = ({ page: { url, id }, domain }: Object) => {
    if (!domain) {
        return url;
    }

    let previewUrl = "//";

    // Removes protocol from the beggining of the URL.
    previewUrl += domain.replace(/(^\w+:|^)\/\//, "");

    previewUrl = trimEnd(previewUrl, "/");
    previewUrl += url;
    previewUrl += "?preview=" + id;
    return previewUrl;
};

const PublishPageButton = ({ page }: Object) => {
    return (
        <Query
            query={gql`
                {
                    settings {
                        cms {
                            domain
                        }
                    }
                }
            `}
        >
            {({ data }) => {
                let url = createPreviewUrl({
                    domain: get(data, "settings.cms.domain"),
                    page
                });

                return (
                    <ButtonSecondary onClick={() => window.open(url, "_blank")}>
                        Preview
                    </ButtonSecondary>
                );
            }}
        </Query>
    );
};

export default compose(
    connect(state => ({ page: omit(getPage(state), ["content"]) })),
    withSnackbar(),
    withRouter()
)(PublishPageButton);
