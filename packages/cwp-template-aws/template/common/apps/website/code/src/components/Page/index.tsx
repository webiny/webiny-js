import React from "react";
import { useQuery } from "@apollo/react-hooks";
import Render from "./Render";
import trim from "lodash.trim";

import { GET_SETTINGS, GET_PUBLISHED_PAGE } from "./graphql";

declare global {
    interface Window {
        __PS_NOT_FOUND_PAGE__: string;
    }
}

// Make sure the final path looks like `/xyz`. We don't want to run into situations where the prerendering engine is
// visiting `/xyz`, but delivery URL is forcing `/xyz/`. This ensures the path is standardized, and the GraphQL
// queries are the same on both sides.
const trimPath = (value: string) => {
    if (typeof value === "string") {
        return "/" + trim(value, "/");
    }
    return null;
};

// Not-found page has `__PS_NOT_FOUND_PAGE__` flag set to true. If so, let's hard-code
// the "/not-found" path, which is what we already have in the Apollo Cache.
const isNotFoundPage = window.__PS_NOT_FOUND_PAGE__;

// We want to write the initial path which returned the not-found page. That way, we still
// allow navigating to other pages, in the `getPath` function below.
const notFoundInitialPath = trimPath(location.pathname);

const getPath = () => {
    let path = location.pathname;
    if (typeof path !== "string") {
        return null;
    }

    path = trimPath(path);

    // Let's check if the not-found page was just served to the user. If so, let's just return page content for the
    // "/not-found" path, which is already present in the initially served HTML and ready to be used by Apollo Cache.
    if (isNotFoundPage && path === notFoundInitialPath) {
        return "/not-found";
    }

    return path;
};

/**
 * This component will fetch the published page's data and pass it to the `Render` function. Note that if the
 * `preview` query parameter is present, we're getting the page directly by its ID, instead of the URL.
 * The `preview` query parameter is set, for example, when previewing pages from Page Builder's editor / Admin app.
 */
const Page = () => {
    const path = getPath();
    const query = new URLSearchParams(location.search);
    const id = query.get("preview");

    // Here we get the page data for current URL, including its content.
    const getPublishedPageQuery = useQuery(GET_PUBLISHED_PAGE(), {
        variables: {
            id,
            path,
            returnErrorPage: true, // API will immediately return the data for the error page, if one occurred.
            returnNotFoundPage: true, // API will immediately return the data for the not-found page, if none was found.
            preview: !!id
        }
    });

    // Here we get all site data like website name, favicon image, social links etc.
    const getSettingsQuery = useQuery(GET_SETTINGS);

    const { data: page, error } = getPublishedPageQuery.data?.pageBuilder?.getPublishedPage || {};
    const settings = getSettingsQuery.data?.pageBuilder?.getSettings?.data || {};

    // Let's render the page.
    return <Render page={page} error={error} settings={settings} />;
};

export default Page;
