// @flow
import * as React from "react";
import gql from "graphql-tag";
import { Query } from "react-apollo";
// Webiny imports
import { withRouter } from "webiny-app/components";
import { Tabs, Tab } from "webiny-ui/Tabs";
import RenderElement from "webiny-app-cms/render/components/Element";
import PageActions from "./PageActions";
import Revisions from "./Revisions";
import type { WithRouterProps } from "webiny-app/components";

const loadRevision = gql`
    query LoadRevision($id: ID!) {
        cms {
            revision: getRevision(id: $id) {
                data {
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
                            title
                            savedOn
                            published
                            locked
                        }
                    }
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

type Props = WithRouterProps;

const PageDetails = ({ router }: Props) => {
    if (!router.getQuery("id")) {
        return <div>Select a page on the left!</div>;
    }

    return (
        <Query query={loadRevision} variables={{ id: router.getQuery("id") }}>
            {({ data, loading }) => {
                if (loading) {
                    return "Loading revision...";
                }

                const { data: revision } = data.cms.revision;
                
                return (
                    <React.Fragment>
                        <PageActions revision={revision} />
                        <Tabs>
                            <Tab label={"Page preview"}>
                                <RenderElement element={revision.content} />
                            </Tab>
                            <Tab label={"Revisions"}>
                                <Revisions page={revision.page} revisions={revision.page.revisions}/>
                            </Tab>
                        </Tabs>
                    </React.Fragment>
                );
            }}
        </Query>
    );
};

export default withRouter()(PageDetails);
