import React from "react";
import kebabCase from "lodash/kebabCase";
import Button from "./Button";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "~/types";
import { createButton } from "@webiny/app-page-builder-elements/renderers/button";

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = kebabCase(args.elementType || "button");

    return {
        name: `pb-render-page-element-${elementType}`,
        type: "pb-render-page-element",
        elementType: elementType,
        renderer: createButton(),
        render(props) {
            return <Button {...props} />;
        }
    };
};
