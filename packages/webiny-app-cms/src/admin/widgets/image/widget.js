import React from "react";
import { createComponent } from "webiny-app";

class ImageWidget extends React.Component {
    render() {
        const { modules: { EditorWidget, Image }, value, onChange } = this.props;
        return (
            <EditorWidget {...{ value, onChange }}>
                <Image
                    name={"image"}
                    onChange={({ value, oldValue }) => {
                        if (!value) {
                            console.log("DELETE IMAGE", oldValue);
                        }
                    }}
                    cropper={{
                        title: `Crop your image`,
                        action: `Save image`,
                        config: {
                            closeOnClick: false
                        }
                    }}
                />
            </EditorWidget>
        );
    }
}

export default createComponent(ImageWidget, { modules: ["Image", "EditorWidget"] });
