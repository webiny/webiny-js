import React from "react";
import { useQuery } from "react-apollo";
import PageRender from "./PageRender";
// import buildQueryProps from "./buildQueryProps";
import { GET_PUBLISHED_PAGE } from "./graphql";

const PageLoad = ({ location }) => {
    const query = new URLSearchParams(location.search);

    const { loading, data, error } = useQuery(GET_PUBLISHED_PAGE, { url: location.pathname, id: query.get("preview") });

    if (error) {
        return <PageRender error={error} />;
    }

    const { data: pageData, error: pageError } = data.pageBuilder.page;

    return <PageRender loading={loading} data={pageData} error={pageError} />;
};

export default PageLoad;
