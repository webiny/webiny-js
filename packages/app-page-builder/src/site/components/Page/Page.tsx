import React from "react";
import PageRender from "./PageRender";
import PageLoad from "./PageLoad";

type PageProps = {
    url?: string;
    id?: string;
    parent?: string;
    data?: any;
};

const Page = (props: PageProps) => {
    if (props.data) {
        return <PageRender {...props} />;
    }

    if (props.location) {
        return <PageLoad {...props} />;
    }

    return null;
};

export default Page;
