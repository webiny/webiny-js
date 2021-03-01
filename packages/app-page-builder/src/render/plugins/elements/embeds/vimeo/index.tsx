import React from "react";
import OEmbed from "../../../../components/OEmbed";
import { PbRenderElementPlugin } from "../../../../../types";
import VimeoEmbed from "./VimeoEmbed";

export default (): PbRenderElementPlugin => {
    const renderEmbed = props => {
        return <VimeoEmbed {...props} />;
    };

    return {
        name: "pb-render-page-element-vimeo",
        type: "pb-render-page-element",
        elementType: "vimeo",
        render(props) {
            return <OEmbed element={props.element} renderEmbed={renderEmbed} />;
        }
    };
};
