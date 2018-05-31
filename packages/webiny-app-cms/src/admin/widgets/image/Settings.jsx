import React, { Fragment } from "react";
import { createComponent } from "webiny-app";

class ImageWidgetSettings extends React.Component {
    render() {
        const {
            Bind,
            handleImage,
            modules: { Select, Image }
        } = this.props;
        return (
            <Fragment>
                <Bind beforeChange={(value, onChange) => {
                    handleImage(this.props, value, onChange);
                }}>
                    <Image
                        name={"image"}
                        label={"Image"}
                        cropper={{
                            title: "Crop your image",
                            action: "Upload image",
                            config: {
                                closeOnClick: false,
                                autoCropArea: 0.7,
                                width: 300,
                                height: 300
                            }
                        }}
                    />
                </Bind>
                <Bind>
                    <Select
                        label={"Image position"}
                        placeholder={"Select position"}
                        name={"imagePosition"}
                        options={[
                            { value: "left", label: "Left" },
                            { value: "right", label: "Right" }
                        ]}
                    />
                </Bind>
            </Fragment>
        );
    }
}

export default createComponent(ImageWidgetSettings, {
    modules: ["Select", "Image"]
});
