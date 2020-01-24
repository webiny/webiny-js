import React, { useMemo } from "react";
import { useQuery } from "react-apollo";
import { get } from "lodash";
import invariant from "invariant";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
import { getPlugins } from "@webiny/plugins";
import { Content, buildQueryProps } from "./Page/index";
import { PbPageLayoutComponentPlugin } from "@webiny/app-page-builder/types";

const defaultPages = {
    error: null,
    notFound: null
};

const NO_404_PAGE_DEFAULT =
    "Could not fetch 404 (not found) page nor was a default page provided (set via PageBuilderProvider).";
const NO_ERROR_PAGE_DEFAULT =
    "Could not fetch error page nor was a default page provided (set via PageBuilderProvider).";

const Page = ({ location }) => {
    const { query, ...options } = buildQueryProps({ location, defaultPages });
    const pageBuilder = usePageBuilder();

    const Loader = useMemo(() => {
        const plugins = getPlugins<PbPageLayoutComponentPlugin>("pb-layout-component");
        const pl = plugins.find(pl => pl.componentType === "loader");
        return pl ? pl.component : null;
    }, []);

    const { loading, data, error: gqlError } = useQuery(query, { variables: options.variables });

    if (loading) {
        return Loader ? <Loader /> : null;
    }

    if (gqlError) {
        const Component = get(pageBuilder, "defaults.pages.error");
        invariant(Component, NO_ERROR_PAGE_DEFAULT);

        return <Component />;
    }

    // Not pretty, but "onComplete" callback executed too late. Will be executed only once.
    if (!defaultPages.error) {
        defaultPages.error = data.pageBuilder.errorPage;
    }

    if (!defaultPages.notFound) {
        defaultPages.notFound = data.pageBuilder.notFoundPage;
    }

    const { data: page, error: pageError } = data.pageBuilder.page;
    const { data: settings } = data.pageBuilder.getSettings;

    if (page) {
        return <Content settings={settings} page={page} />;
    }

    if (pageError.code === "NOT_FOUND") {
        if (defaultPages.notFound) {
            return <Content settings={settings} page={defaultPages.notFound.data} />;
        }

        const Component = get(pageBuilder, "defaults.pages.notFound");
        invariant(Component, NO_404_PAGE_DEFAULT);
        return <Component />;
    }

    if (defaultPages.error) {
        return <Content settings={settings} page={defaultPages.error.data} />;
    }

    const Component = get(pageBuilder, "defaults.pages.error");
    invariant(Component, NO_ERROR_PAGE_DEFAULT);
    return <Component />;
};

export default Page;
