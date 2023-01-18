import kebabCase from "lodash/kebabCase";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "~/types";
import Icon from "./Icon";
import { createIcon } from "@webiny/app-page-builder-elements/renderers/icon";
import { isLegacyRenderingEngine } from "~/utils";
import React from "react";

// @ts-ignore Resolve once we deprecate legacy rendering engine.
const render: PbRenderElementPlugin["render"] = isLegacyRenderingEngine
    ? props => <Icon {...props} />
    : createIcon();

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = args.elementType || "icon";

    return {
        name: `pb-render-page-element-${kebabCase(elementType)}`,
        type: "pb-render-page-element",
        elementType: "icon",
        render
    };
};
