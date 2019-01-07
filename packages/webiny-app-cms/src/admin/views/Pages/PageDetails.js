// @flow
import * as React from "react";
import { compose, withProps } from "recompose";
import { Query } from "react-apollo";
import { renderPlugins } from "webiny-app/plugins";
import { withRouter } from "webiny-app/components";
import type { WithRouterProps } from "webiny-app/components";
import styled from "react-emotion";
import { Elevation } from "webiny-ui/Elevation";
import { Typography } from "webiny-ui/Typography";
import { getPage } from "webiny-app-cms/admin/graphql/pages";
import editorMock from "webiny-app-cms/admin/assets/editor-mock.png";
import { LoadingEditor, LoadingTitle } from "./EditorStyled.js";
import { PageDetailsProvider, PageDetailsConsumer } from "../../components/PageDetailsContext";
import { ElementAnimation } from "webiny-app-cms/render/components";
import { withSnackbar, type WithSnackbarProps } from "webiny-admin/components";
import { get } from "lodash";

type Props = WithRouterProps &
    WithSnackbarProps & {
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

const EmptyPageDetails = () => {
    return (
        <EmptySelect>
            <Elevation z={2} className={"select-page"}>
                Select a page on the left side, or click the green button to create a new one.
            </Elevation>
        </EmptySelect>
    );
};

const PageDetails = ({ pageId, router, showSnackbar }: Props) => {
    if (!pageId) {
        return <EmptyPageDetails />;
    }

    return (
        <Query
            query={getPage()}
            variables={{ id: pageId }}
            onCompleted={data => {
                const error = get(data, "cms.page.error.message");
                if (error) {
                    router.goToRoute({
                        params: { id: null },
                        merge: true
                    });
                    showSnackbar(error);
                }
            }}
        >
            {({ data, loading }) => {
                if (loading) {
                    return (
                        <LoadingEditor>
                            <img src={editorMock} />
                            <LoadingTitle>
                                <Typography tag={"div"} use={"headline6"}>
                                    Loading page...<span>.</span>
                                    <span>.</span>
                                    <span>.</span>
                                </Typography>
                            </LoadingTitle>
                        </LoadingEditor>
                    );
                }

                const details = { page: loading ? {} : data.cms.page.data, loading };
                if (!details.page) {
                    return <EmptyPageDetails />;
                }

                return (
                    <ElementAnimation>
                        {({ refresh }) => (
                            <DetailsContainer onScroll={refresh}>
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
                        )}
                    </ElementAnimation>
                );
            }}
        </Query>
    );
};

export default compose(
    withRouter(),
    withSnackbar(),
    withProps(({ router }) => ({
        pageId: router.getQuery("id")
    }))
)(PageDetails);
