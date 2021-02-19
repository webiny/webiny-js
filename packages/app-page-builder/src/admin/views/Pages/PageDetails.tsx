import React, { useEffect, useState } from "react";
import get from "lodash/get";
import { useRouter } from "@webiny/react-router";
import styled from "@emotion/styled";
import { useApolloClient } from "@apollo/react-hooks";
import { renderPlugins } from "@webiny/app/plugins";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { GET_PAGE } from "../../graphql/pages";
import ElementAnimation from "../../../render/components/ElementAnimation";
import { ButtonDefault, ButtonIcon } from "@webiny/ui/Button";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { i18n } from "@webiny/app/i18n";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { useCms } from "@webiny/app-headless-cms/admin/hooks";
import { SnackbarAction } from "@webiny/ui/Snackbar";
import { gql } from "graphql-tag";

const t = i18n.ns("app-page-builder/admin/views/pages/page-details");

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
const DetailsContainer = styled("div")({
    height: "calc(100% - 10px)",
    overflow: "hidden",
    position: "relative",
    nav: {
        backgroundColor: "var(--mdc-theme-surface)"
    }
});
type EmptyPageDetailsProps = {
    onCreatePage: (event?: React.SyntheticEvent) => void;
    canCreate: boolean;
};
const EmptyPageDetails = ({ onCreatePage, canCreate }: EmptyPageDetailsProps) => {
    return (
        <EmptyView
            title={t`Click on the left side list to display page details {message} `({
                message: canCreate ? "or create a..." : ""
            })}
            action={
                canCreate ? (
                    <ButtonDefault data-testid="new-record-button" onClick={onCreatePage}>
                        <ButtonIcon icon={<AddIcon />} /> {t`New Page`}
                    </ButtonDefault>
                ) : null
            }
        />
    );
};
type PageDetailsProps = {
    onCreatePage: (event?: React.SyntheticEvent) => void;
    canCreate: boolean;
};
const PageDetails = ({ onCreatePage, canCreate }: PageDetailsProps) => {
    const [page, setPage] = useState({});
    const [loading, setLoading] = useState(false);
    const { history, location } = useRouter();
    const { showSnackbar } = useSnackbar();
    const pageClient = useApolloClient();
    const { createApolloClient } = useCms();

    const query = new URLSearchParams(location.search);
    const pageId = query.get("id");

    const runQuery = async (client, ds) => {
        const variables = {};
        for (const v of ds.config.variables) {
            if (!v.previewValue || v.previewValue === "") {
                throw new Error(`Missing preview value for variable "${v.name}"!`);
            }
            variables[v.name] = v.previewValue;
        }

        const { data } = await client.query({
            query: gql(ds.config.query),
            variables
        });

        return data;
    };

    const loadDataSources = async dataSources => {
        const ds = dataSources.find(ds => ds.id === "get-entry");
        if (!ds) {
            return [];
        }
        const client = createApolloClient({ uri: ds.config.url });
        try {
            const result = await runQuery(client, ds);
            return [{ id: ds.id, name: ds.name, data: result }];
        } catch (e) {
            showSnackbar(
                <span>
                    <strong>Failed to load datasource &quot;{ds.name}&quot;</strong>
                    <br />
                    {e.message}
                </span>,
                {
                    timeout: 60000,
                    dismissesOnAction: true,
                    action: <SnackbarAction label={"OK"} />
                }
            );
        }
    };

    const loadPage = async () => {
        setLoading(true);
        const response = await pageClient.query({
            query: GET_PAGE,
            variables: { id: pageId }
        });

        const { data: page, error } = response.data.pageBuilder.getPage;
        if (error) {
            history.push("/page-builder/pages");
            showSnackbar(error.message);
        }

        if (page.dynamic) {
            const dataSources = await loadDataSources(page.settings.dataSources);
            page.dataSources = dataSources;
            if (dataSources.length && page.title.includes("${")) {
                const placeholders: string[] = Array.from(
                    page.title.matchAll(/\$\{([a-zA-Z\.]+)\}/g)
                );
                for (let j = 0; j < placeholders.length; j++) {
                    const [replace, path] = placeholders[j];
                    page.title = page.title.replace(replace, get(dataSources[0].data, path));
                }
            }
        }

        setLoading(false);
        setPage(page);
    };

    useEffect(() => {
        if (!pageId) {
            return;
        }
        loadPage();
    }, [pageId]);

    if (!pageId) {
        return <EmptyPageDetails canCreate={canCreate} onCreatePage={onCreatePage} />;
    }

    return (
        <ElementAnimation>
            {({ refresh }) => (
                <DetailsContainer onScroll={refresh}>
                    <test-id data-testid="pb-page-details">
                        {renderPlugins("pb-page-details", {
                            page,
                            loading
                        })}
                    </test-id>
                </DetailsContainer>
            )}
        </ElementAnimation>
    );
};

export default PageDetails;
