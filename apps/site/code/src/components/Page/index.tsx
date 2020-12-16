import React from "react";
import { useQuery } from "react-apollo";
import Render from "./Render";

import { GET_PUBLISHED_PAGE } from "./graphql";

/**
 * This component will fetch the published page's data and pass it to the `Render` function. Note that if the
 * `preview` query parameter is present, we're getting the page directly by its ID, instead of the URL.
 * The `preview` query parameter is set, for example, when previewing pages from Page Builder's editor / Admin app.
 */
const Page = () => {
    const url = location.pathname;
    const query = new URLSearchParams(location.search);
    const id = query.get("preview");

    const getPublishedPageQuery = useQuery(GET_PUBLISHED_PAGE(), {
        variables: {
            id,
            url,
            returnErrorPage: true, // API will immediately return the data for the error page, if one occurred.
            returnNotFoundPage: true, // API will immediately return the data for the not-found page, if none was found.
            preview: !!id
        }
    });

    // Will spread `{ error: any, data: PbPageData }` object as component's props.
    return <Render {...getPublishedPageQuery.data?.pageBuilder?.getPublishedPage} />;
};

export default Page;
