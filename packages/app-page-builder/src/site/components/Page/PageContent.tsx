import React from "react";
import Element from "@webiny/app-page-builder/render/components/Element";

type ContentProps = {
    data?: any;
};

const PageContent = ({ data }: ContentProps) => {
    return <Element element={data} />;
};

export default PageContent;
