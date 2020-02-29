import React from "react";
import { useQuery } from "react-apollo";
import PageRender from "./PageRender";
import { GET_PUBLISHED_PAGE } from "./graphql";

type PageLoadProps = {
    url?: string;
    id?: string;
    parent?: string;
};

const PageLoad = ({ parent, id, url }: PageLoadProps) => {
    const { loading, data, error } = useQuery(
        GET_PUBLISHED_PAGE(),
        {
            variables: { parent, id, url, returnErrorPage: true, returnNotFoundPage: true }
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
