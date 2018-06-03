import React from "react";
import { Component } from "webiny-app";
import { Widget } from "webiny-app-cms";
import placeholderImage from "./placeholder.jpg";

const ImageWithTextComponent = Component({ modules: ["SlateEditor"] })(
    ({ data, modules: { SlateEditor } }) => {
        const image = (
            <div
                style={{
                    flexBasis: (data.imageSize || 50) + "%",
                    padding: parseInt(data.padding) || 10
                }}
                key={"image"}
            >
                <img src={(data.image && data.image.src) || placeholderImage} width={"100%"} />
            </div>
        );

        const text = (
            <div
                style={{
                    flexBasis: 100 - (data.imageSize || 50) + "%",
                    padding: parseInt(data.padding) || 10
                }}
                key={"text"}
            >
                <SlateEditor value={data.text} />
            </div>
        );

        return (
            <div style={{ display: "flex" }}>
                {data.imagePosition === "left" ? [image, text] : [text, image]}
            </div>
        );
    }
);

/**
 * "Image with text" widget plugin
 */
class ImageWithText extends Widget {
    render({ widget: { data } }) {
        return <ImageWithTextComponent data={data} />;
    }
}

export default ImageWithText;
