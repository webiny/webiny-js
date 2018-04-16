import React from "react";
import { createComponent } from "webiny-app";

class ImageWidget extends React.Component {
    render() {
        const {
            modules: { Image, Input, EditorWidget },
            value,
            onChange,
            handleImage
        } = this.props;
        return (
            <EditorWidget value={value} onChange={onChange}>
                {({ Bind }) => (
                    <React.Fragment>
                        <Bind
                            beforeChange={(value, onChange) =>
                                handleImage(this.props, value, onChange)
                            }
                        >
                            <Image
                                name={"image"}
                                sizeLimit={10000000}
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
                            <Input placeholder={"Image caption"} name={"caption"} />
                        </Bind>
                    </React.Fragment>
                )}
            </EditorWidget>
        );
    }
}

export default createComponent(ImageWidget, { modules: ["Image", "Input", "EditorWidget"] });
