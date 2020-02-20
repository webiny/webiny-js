import React, { useMemo } from "react";
import { useQuery } from "react-apollo";
import { getPlugins } from "@webiny/plugins";
import { Content, buildQueryProps } from "./Page/index";
import { PbPageLayoutComponentPlugin, PbDefaultPagePlugin } from "@webiny/app-page-builder/types";

const NO_NOT_FOUND_PAGE_DEFAULT =
    "Could not fetch 404 (not found) page nor was a default page provided (set via PageBuilderProvider).";
const NO_ERROR_PAGE_DEFAULT =
    "Could not fetch error page nor was a default page provided (set via PageBuilderProvider).";

const Page = ({ location }) => {
    const { query, ...options } = buildQueryProps({ location });

    const Loader = useMemo(() => {
        const plugins = getPlugins<PbPageLayoutComponentPlugin>("pb-layout-component");
        const pl = plugins.find(pl => pl.componentType === "loader");
        return pl ? pl.component : null;
    }, []);

    const [DefaultErrorPage, DefaultNotFoundPage] = useMemo(() => {
        let DefaultErrorPage, DefaultNotFoundPage;
        const plugins = getPlugins<PbDefaultPagePlugin>("pb-default-page");
        for (let i = 0; i < plugins.length; i++) {
            const plugin = plugins[i];
            if (plugin.name === "pb-default-page-error") {
                DefaultErrorPage = plugin.component;
            }

            if (plugin.name === "pb-default-page-not-found") {
                DefaultNotFoundPage = plugin.component;
            }
        }

        if (!DefaultErrorPage) {
            throw new Error(NO_ERROR_PAGE_DEFAULT);
        }

        if (!DefaultNotFoundPage) {
            throw new Error(NO_NOT_FOUND_PAGE_DEFAULT);
        }

        return [DefaultErrorPage, DefaultNotFoundPage];
    }, []);

    const { loading, data, error: gqlError } = useQuery(query, { variables: options.variables });

    if (loading) {
        return Loader ? <Loader /> : null;
    }

    if (gqlError) {
        return <DefaultErrorPage />;
    }

    const { data: page, error: pageError } = data.pageBuilder.page;
    const { data: settings } = data.pageBuilder.getSettings;

    if (page) {
        return <Content settings={settings} page={page} />;
    }

    if (pageError.code === "NOT_FOUND") {
        return <DefaultNotFoundPage setting={settings} error={pageError} />;
    }
    return <DefaultErrorPage setting={settings} error={pageError} />;
};

export default Page;
