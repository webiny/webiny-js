import React from "react";
import { createComponent } from "webiny-app";

class ImageWidget extends React.Component {
    render() {
        const { modules: { EditorWidget, Image, Input }, value, onChange } = this.props;
        return (
            <EditorWidget {...{ value, onChange }}>
                {({ Bind }) => (
                    <React.Fragment>
                        <Bind>
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
                        </Bind>
                        <Bind>
                            <Input name={"caption"} label={"Caption"} />
                        </Bind>
                    </React.Fragment>
                )}
            </EditorWidget>
        );
    }
}

export default createComponent(ImageWidget, { modules: ["Image", "EditorWidget", "Input"] });
