import React from "react";
import { PbRenderElementPlugin } from "@webiny/app-website";
import { CheckboxGroupFieldRenderer } from "./CheckboxGroupFieldRenderer";
import { ELEMENT_TYPE } from "./constants";

export const CheckboxGroupFieldWebsitePlugins = () => (
    <PbRenderElementPlugin elementType={ELEMENT_TYPE} renderer={CheckboxGroupFieldRenderer} />
);
