// @flow
import * as React from "react";
import { compose, withProps } from "recompose";
import { graphql } from "react-apollo";
import { renderPlugins } from "webiny-app/plugins";
import { withRouter } from "webiny-app/components";
import { PageDetailsProvider, PageDetailsConsumer } from "../../components/PageDetailsContext";
import type { WithRouterProps } from "webiny-app/components";
import Loader from "./Loader";
import { getPage } from "webiny-app-cms/admin/graphql/pages";

type Props = WithRouterProps & {
    pageId: string,
    page: Object,
    loading: boolean
};

const PageDetails = ({ router, page, loading }: Props) => {
    if (!router.getQuery("id")) {
        return <div>Select a page on the left!</div>;
    }

    if (loading) {
        /* TODO: Ovo je C/P loadera od DataList komponente, treba ga sloziti da lici na taj PageDetails view */
        return <Loader />;
    }

    const details = { page, loading };

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
        pageId: router.getQuery("id")
    })),
    graphql(getPage, {
        skip: props => !props.pageId,
        options: ({ pageId }) => ({ variables: { id: pageId } }),
        props: ({ data }) => {
            return {
                loading: data.loading,
                page: data.loading ? {} : data.cms.page.data
            };
        }
    })
)(PageDetails);
