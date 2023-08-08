import React from "react";
import { Content } from "@webiny/app-page-builder-elements/components/Content";

type ElementPreviewPropsType = {
    element: any;
};

const ElementPreview: React.FC<ElementPreviewPropsType> = ({ element }) => {
    return <Content content={element} />;
};

export default ElementPreview;
