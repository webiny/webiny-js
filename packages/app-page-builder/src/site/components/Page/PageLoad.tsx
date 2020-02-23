import React from "react";
import { useQuery } from "react-apollo";
import PageRender from "./PageRender";
import { GET_PUBLISHED_PAGE } from "./graphql";

const PageLoad = ({ location }) => {
    const query = new URLSearchParams(location.search);

    const { loading, data, error } = useQuery(
        GET_PUBLISHED_PAGE({ returnErrorPage: true, returnNotFoundPage: true }),
        {
            variables: {
                url: location.pathname,
                id: query.get("preview")
            }
        }
    );

    if (error) {
        return <PageRender error={error} />;
    }

    const props = {
        ...data?.pageBuilder?.page,
        loading
    };

    return <PageRender {...props} />;
};

export default PageLoad;
