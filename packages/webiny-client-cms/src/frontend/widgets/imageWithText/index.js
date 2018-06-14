import React from "react";
import { inject } from "webiny-client";
import { Widget } from "webiny-client-cms";
import placeholderImage from "./placeholder.jpg";

const ImageWithTextComponent = inject({ modules: ["SlateEditor"] })(
    ({ widget: { data }, modules: { SlateEditor } }) => {
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
@inject({
    modules: ["Select", "IconPicker", "Grid"]
})
class ImageWithText extends Widget {
    render({ WidgetContainer }) {
        return (
            <WidgetContainer>
                {({ widgetProps }) => <ImageWithTextComponent {...widgetProps} />}
            </WidgetContainer>
        );
    }
}

export default ImageWithText;
