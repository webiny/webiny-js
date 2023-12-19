import React from "react";
import { Content } from "@webiny/app-page-builder-elements/components/Content";

type ElementPreviewPropsType = {
    element: any;
};

const ElementPreview = ({ element }: ElementPreviewPropsType) => {
    return <Content content={element} />;
};

export default ElementPreview;
