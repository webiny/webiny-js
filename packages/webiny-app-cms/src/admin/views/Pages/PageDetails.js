// @flow
import * as React from "react";
import { compose, withProps } from "recompose";
import { graphql } from "react-apollo";
import { renderPlugins } from "webiny-app/plugins";
import { withRouter } from "webiny-app/components";
import { PageDetailsProvider, PageDetailsConsumer } from "../../components/PageDetailsContext";
import type { WithRouterProps } from "webiny-app/components";
import { loadRevision, loadPageRevisions } from "webiny-app-cms/admin/graphql/pages";
import Loader from "./Loader";

type Props = WithRouterProps & {
    pageId: string,
    refreshPages: Function,
    revision: {
        data: Object,
        loading: boolean,
        refetch: Function
    },
    revisions: {
        data: Array<Object>,
        loading: boolean,
        refetch: Function
    }
};

const PageDetails = ({ router, pageId, revision, revisions, refreshPages }: Props) => {
    if (!router.getQuery("revision")) {
        return <div>Select a page on the left!</div>;
    }

    if (revision.loading) {
        /* TODO: Ovo je C/P loadera od DataList komponente, treba ga sloziti da lici na taj PageDetails view */
        return <Loader />;
    }

    const details = { pageId, refreshPages, revision, revisions };

    return (
        <PageDetailsProvider value={details}>
            <PageDetailsConsumer>
                {pageDetails => (
                    <React.Fragment>
                        {renderPlugins("cms-page-details", { pageDetails })}
                    </React.Fragment>
                )}
            </PageDetailsConsumer>
        </PageDetailsProvider>
    );
};

export default compose(
    withRouter(),
    withProps(({ router }) => ({
        pageId: router.getQuery("id"),
        revisionId: router.getQuery("revision")
    })),
    graphql(loadRevision, {
        skip: props => !props.revisionId,
        options: ({ revisionId }) => ({ variables: { id: revisionId } }),
        props: ({ data }) => {
            return {
                revision: {
                    loading: data.loading,
                    data: data.loading ? {} : data.cms.revision.data,
                    refetch: data.refetch
                }
            };
        }
    }),
    graphql(loadPageRevisions, {
        skip: props => !props.pageId,
        options: ({ pageId }) => ({ variables: { id: pageId } }),
        props: ({ data }) => ({
            revisions: {
                loading: data.loading,
                data: data.loading ? [] : data.cms.revisions.data,
                refetch: data.refetch
            }
        })
    })
)(PageDetails);
