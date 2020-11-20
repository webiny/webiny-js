import React from "react";
import { useQuery } from "react-apollo";
import { useRouter } from "@webiny/react-router";
import styled from "@emotion/styled";
import { Elevation } from "@webiny/ui/Elevation";
import { renderPlugins } from "@webiny/app/plugins";
import { GET_PAGE } from "@webiny/app-page-builder/admin/graphql/pages";
import { ElementAnimation } from "@webiny/app-page-builder/render/components";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "test-id": {
                children?: React.ReactNode;
            };
        }
    }
}

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

const PageDetails = () => {
    const { history, location } = useRouter();
    const { showSnackbar } = useSnackbar();

    const query = new URLSearchParams(location.search);
    const pageId = query.get("id");

    if (!pageId) {
        return <EmptyPageDetails />;
    }

    const getPageQuery = useQuery(GET_PAGE, {
        variables: { id: pageId },
        skip: !pageId,
        onCompleted: data => {
            const error = data?.pageBuilder?.getPage?.error;
            if (error) {
                history.push("/page-builder/pages");
                showSnackbar(error.message);
            }
        }
    });

    const page = getPageQuery.data?.pageBuilder?.getPage?.data || {};

    return (
        <ElementAnimation>
            {({ refresh }) => (
                <DetailsContainer onScroll={refresh}>
                    <test-id data-testid="pb-page-details">
                        {renderPlugins("pb-page-details", {
                            page,
                            getPageQuery
                        })}
                    </test-id>
                </DetailsContainer>
            )}
        </ElementAnimation>
    );
};

export default PageDetails;
