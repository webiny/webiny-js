// @flow
import * as React from "react";
import { connect } from "react-redux";
import { compose } from "recompose";
import gql from "graphql-tag";
import { Query } from "react-apollo";
// Webiny imports
import { withRouter, withForm } from "webiny-app/components";
import { refreshDataList } from "webiny-app/actions";
import { withSnackbar } from "webiny-app-admin/components";
import { Tabs, Tab } from "webiny-ui/Tabs";
import RenderElement from "webiny-app-cms/render/components/Element";
import RevisionActions from "./RevisionActions";

const loadRevision = gql`
    query LoadRevision($id: ID!) {
        Cms {
            revision: getRevision(id: $id) {
                id
                name
                title
                slug
                content
                settings
                page {
                    id
                    revisions {
                        id
                        name
                    }
                }
            }
        }
    }
`;

class PageDetails extends React.Component<*> {
    render() {
        const { router } = this.props;
        
        if (!router.getQuery("id")) {
            return <div>Select a page on the left!</div>;
        }

        return (
            <Query query={loadRevision} variables={{ id: router.getQuery("id") }}>
                {({ data, loading }) => {
                    if (loading) {
                        return "Loading revision...";
                    }

                    const { revision } = data.Cms;

                    return (
                        <React.Fragment>
                            <RevisionActions revision={revision} />
                            <Tabs>
                                <Tab label={"Page preview"}>
                                    <RenderElement element={revision.content} />
                                </Tab>
                                <Tab label={"Stats"} />
                                <Tab label={"Revisions"} />
                            </Tabs>
                        </React.Fragment>
                    );
                }}
            </Query>
        );
    }
}

export default compose(
    connect(
        null,
        { refreshDataList }
    ),
    withSnackbar(),
    withRouter()
)(PageDetails);
