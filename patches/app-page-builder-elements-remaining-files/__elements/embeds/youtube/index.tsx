import React from "react";
import kebabCase from "lodash/kebabCase";
import OEmbed from "../~/components/OEmbed";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "../~/types";
import YoutubeEmbed from "./YoutubeEmbed";

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const renderEmbed = props => {
        return <YoutubeEmbed {...props} />;
    };

    const elementType = kebabCase(args.elementType || "youtube");

    return {
        name: "pb-render-page-element-" + elementType,
        type: "pb-render-page-element",
        elementType: elementType,
        render(props) {
            return <OEmbed element={props.element} renderEmbed={renderEmbed} />;
        }
    };
};
