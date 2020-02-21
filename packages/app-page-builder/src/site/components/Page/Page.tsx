import React from "react";
import PageRender from "./PageRender";
import PageLoad from "./PageLoad";

const Page = (props) => {
    if (props.data) {
        return <PageRender {...props} />;
    }

    if (props.location) {
        return <PageLoad {...props}/>
    }

    return null;
};

export default Page;
