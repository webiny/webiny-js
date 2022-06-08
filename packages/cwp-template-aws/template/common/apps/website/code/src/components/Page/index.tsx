import React, { useCallback } from "react";
import { useQuery } from "@apollo/react-hooks";
import { useSearchParams, useLocation } from "@webiny/react-router";
import Render from "./Render";
import trim from "lodash/trim";
import {
    GET_SETTINGS,
    GET_PUBLISHED_PAGE,
    PublishedPageQueryResponse,
    PublishedPageQueryVariables,
    SettingsQueryResponse,
    SettingsQueryResponseData
} from "./graphql";

declare global {
    interface Window {
        __PS_NOT_FOUND_PAGE__: string;
    }
}

// Make sure the final path looks like `/xyz`. We don't want to run into situations where the prerendering engine is
// visiting `/xyz`, but delivery URL is forcing `/xyz/`. This ensures the path is standardized, and the GraphQL
// queries are the same on both sides.
const trimPath = (value: string) => {
    return "/" + trim(value, "/");
};

// We want to write the initial path which returned the not-found page. That way, we still
// allow navigating to other pages, in the `getPath` function below.
const notFoundInitialPath = trimPath(location.pathname);

/**
 * This component will fetch the published page's data and pass it to the `Render` function. Note that if the
 * `preview` query parameter is present, we're getting the page directly by its ID, instead of the URL.
 * The `preview` search parameter is set, for example, when previewing pages from Page Builder's editor / Admin app.
 */
const Page: React.FC = () => {
    const { pathname } = useLocation();
    const [search] = useSearchParams();

    const getPath = useCallback(() => {
        const path = trimPath(pathname);

        // Let's check if the not-found page was served to the user. If so, let's return page content for the
        // "__PS_NOT_FOUND_PAGE__" path, which is already present in the initially served HTML and ready to be used by Apollo Cache.
        if (window.__PS_NOT_FOUND_PAGE__ && path === notFoundInitialPath) {
            return window.__PS_NOT_FOUND_PAGE__;
        }

        return path;
    }, [pathname]);

    // When using page preview, we're passing page ID via search params.
    const id = search.get("preview");

    // Here we get the page data for current URL, including its content.
    const getPublishedPageQuery = useQuery<PublishedPageQueryResponse, PublishedPageQueryVariables>(
        GET_PUBLISHED_PAGE(),
        {
            variables: {
                id,
                path: getPath(),
                returnNotFoundPage: true, // API will immediately return the data for the not-found page, if none was found.
                preview: !!id
            }
        }
    );

    // Here we get all site data like website name, favicon image, social links etc.
    const getSettingsQuery = useQuery<SettingsQueryResponse>(GET_SETTINGS);

    const { data: page = null, error = null } =
        getPublishedPageQuery.data?.pageBuilder?.getPublishedPage || {};
    const settings =
        getSettingsQuery.data?.pageBuilder?.getSettings?.data || ({} as SettingsQueryResponseData);

    // Let's render the page.
    return <Render page={page} error={error} settings={settings} />;
};

export default Page;
