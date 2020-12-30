import React from "react";
import { useQuery } from "react-apollo";
import Render from "./Render";
import trim from "lodash.trim";

import { GET_SETTINGS, GET_PUBLISHED_PAGE } from "./graphql";

// Make sure the final path looks like `/xyz`. We don't want to run into situations where the prerendering engine is
// visiting `/xyz`, but delivery URL is forcing `/xyz/`. This ensures the path is standardized, and the GraphQL
// queries are the same on both sides.
const trimPath = (value: string) => {
    if (typeof value === "string") {
        return "/" + trim(value, "/");
    }
    return null;
};

/**
 * This component will fetch the published page's data and pass it to the `Render` function. Note that if the
 * `preview` query parameter is present, we're getting the page directly by its ID, instead of the URL.
 * The `preview` query parameter is set, for example, when previewing pages from Page Builder's editor / Admin app.
 */
const Page = () => {
    const path = trimPath(location.pathname);
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
