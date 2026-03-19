import React from "react";
import { PbRenderElementPlugin } from "@webiny/app-website";
import { TextareaFieldRenderer } from "./TextareaFieldRenderer";
import { ELEMENT_TYPE } from "./constants";

export const TextareaFieldWebsitePlugins = () => (
    <PbRenderElementPlugin elementType={ELEMENT_TYPE} renderer={TextareaFieldRenderer} />
);
