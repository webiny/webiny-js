import React from "react";
import PageRender from "./PageRender";
import PageLoad from "./PageLoad";
import PageContent from "./PageContent";
import { PbPageData } from "@webiny/app-page-builder/types";

type PageProps = {
    url?: string;
    id?: string;
    parent?: string;
    data?: PbPageData;
    content?: any;
};

const Page = (props: PageProps) => {
    if (props.content) {
        return <PageContent data={props.content} />;
    }

    if (props.data) {
        return <PageRender {...props} />;
    }

    if (props.url || props.id || props.parent) {
        return <PageLoad {...props} />;
    }

    return null;
};

export default Page;
