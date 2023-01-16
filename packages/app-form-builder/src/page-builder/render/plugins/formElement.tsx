import React from "react";
import { PbRenderElementPlugin } from "@webiny/app-page-builder/types";
import FormElementComponent from "./FormElementComponent";

const plugin: PbRenderElementPlugin = {
    name: "pb-render-page-element-form",
    type: "pb-render-page-element",
    elementType: "form",
    render(props) {
        return <FormElementComponent {...props} />;
    },
    renderer(props: any) {
        return <FormElementComponent {...props} />;
    }
};
export default plugin;
