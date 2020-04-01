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


declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "ssr-cache": {
                class?: string;
                id?: string;
            };
        }
    }
}

const getPageRender = props => {
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

const Page = (props: PageProps) => {
    return (
        <>
            {getPageRender(props)}
            <ssr-cache data-class="pb-page" />
        </>
    );
};

export default Page;
