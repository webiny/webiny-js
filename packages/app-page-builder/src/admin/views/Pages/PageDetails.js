import React from "react";
import { Query } from "react-apollo";
import useReactRouter from "use-react-router";
import styled from "@emotion/styled";
import { Elevation } from "@webiny/ui/Elevation";
import { renderPlugins } from "@webiny/app/plugins";
import { getPage } from "@webiny/app-page-builder/admin/graphql/pages";
import { PageDetailsProvider, PageDetailsConsumer } from "../../contexts/PageDetails";
import { ElementAnimation } from "@webiny/app-page-builder/render/components";
import { useSnackbar } from "@webiny/app-admin/components";
import { get } from "lodash";

const EmptySelect = styled("div")({
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--mdc-theme-on-surface)",
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

const PageDetails = ({ refreshPages }) => {
    const { history, location } = useReactRouter();
    const { showSnackbar } = useSnackbar();

    const query = new URLSearchParams(location.search);
    const pageId = query.get("id");

    if (!pageId) {
        return <EmptyPageDetails />;
    }

    return (
        <Query
            query={getPage()}
            variables={{ id: pageId }}
            onCompleted={data => {
                const error = get(data, "pageBuilder.page.error.message");
                if (error) {
                    query.delete("id");
                    history.push({ search: query.toString() });
                    showSnackbar(error);
                }
            }}
        >
            {({ data, loading }) => {
                const details = { page: get(data, "pageBuilder.page.data") || {}, loading };
                return (
                    <ElementAnimation>
                        {({ refresh }) => (
                            <DetailsContainer onScroll={refresh}>
                                <PageDetailsProvider value={details}>
                                    <PageDetailsConsumer>
                                        {pageDetails => (
                                            <React.Fragment>
                                                {renderPlugins("pb-page-details", {
                                                    refreshPages,
                                                    pageDetails,
                                                    loading
                                                })}
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

export default PageDetails;
