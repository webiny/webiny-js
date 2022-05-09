import React from "react";
import kebabCase from "lodash/kebabCase";
import Button from "./Button";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "~/types";

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = kebabCase(args.elementType || "button");

    return {
        name: `pb-render-page-element-${elementType}`,
        type: "pb-render-page-element",
        elementType: elementType,
        render(props) {
            return <Button {...props} />;
        }
    };
};
