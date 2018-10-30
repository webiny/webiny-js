// @flow
import * as React from "react";
import { compose, withProps } from "recompose";
import { graphql } from "react-apollo";
import { renderPlugins } from "webiny-app/plugins";
import { withRouter } from "webiny-app/components";
import { PageDetailsProvider, PageDetailsConsumer } from "../../components/PageDetailsContext";
import type { WithRouterProps } from "webiny-app/components";
import Loader from "./Loader";
import styled from "react-emotion";
import { Elevation } from "webiny-ui/Elevation";
import { getPage } from "webiny-app-cms/admin/graphql/pages";

type Props = WithRouterProps & {
    pageId: string,
    page: Object,
    loading: boolean
};

const EmptySelect = styled("div")({
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ".select-page": {
        maxWidth: 400,
        padding: "50px 100px",
        textAlign: "center",
        display: "block",
        borderRadius: 2,
        backgroundColor: "var(--mdc-theme-surface)"
    }
});

const DetailsContainer = styled("div")({
    height: "calc(100% - 10px)",
    overflow: "hidden",
    position: "relative",
    nav: {
        backgroundColor: "var(--mdc-theme-surface)"
    }
});

const PageDetails = ({ router, page, loading }: Props) => {
    if (!router.getQuery("id")) {
        return (
            <EmptySelect>
                <Elevation z={2} className={"select-page"}>
                    Select a page on the left side, or click the green button to create a new one.
                </Elevation>
            </EmptySelect>
        );
    }

    if (loading) {
        /* TODO: Ovo je C/P loadera od DataList komponente, treba ga sloziti da lici na taj PageDetails view */
        return <Loader />;
    }

    const details = { page, loading };

    return (
        <DetailsContainer>
            <PageDetailsProvider value={details}>
                <PageDetailsConsumer>
                    {pageDetails => (
                        <React.Fragment>
                            {renderPlugins("cms-page-details", { pageDetails })}
                        </React.Fragment>
                    )}
                </PageDetailsConsumer>
            </PageDetailsProvider>
        </DetailsContainer>
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
