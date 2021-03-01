import React from "react";
import OEmbed from "../../../../components/OEmbed";
import { PbRenderElementPlugin } from "../../../../../types";
import YoutubeEmbed from "./YoutubeEmbed";

export default (): PbRenderElementPlugin => {
    const renderEmbed = props => {
        return <YoutubeEmbed {...props} />;
    };

    return {
        name: "pb-render-page-element-youtube",
        type: "pb-render-page-element",
        elementType: "youtube",
        render(props) {
            return <OEmbed element={props.element} renderEmbed={renderEmbed} />;
        }
    };
};
