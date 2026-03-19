import React from "react";
import { PbRenderElementPlugin } from "@webiny/app-website";
import { TextFieldRenderer } from "./TextFieldRenderer";
import { ELEMENT_TYPE } from "./constants";

export const TextFieldWebsitePlugins = () => (
    <PbRenderElementPlugin elementType={ELEMENT_TYPE} renderer={TextFieldRenderer} />
);
