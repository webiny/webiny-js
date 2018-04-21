import React from "react";
import { createComponent } from "webiny-app";

class ImageWidget extends React.Component {
    render() {
        const {
            modules: { Image, Input, ChangeConfirm },
            Bind,
            handleImage,
            isGlobal
        } = this.props;
        return (
            <React.Fragment>
                <ChangeConfirm
                    title={"Be careful!"}
                    confirm={"I'm aware of what I am doing!"}
                    cancel={"Maybe later"}
                    message={
                        <span>
                            You are about to remove an image from a global widget.
                            <br />All the content that is currently using this widget will be
                            affected!
                        </span>
                    }
                >
                    {({ showConfirmation }) => (
                        <Bind
                            beforeChange={(value, onChange) => {
                                if (isGlobal) {
                                    return showConfirmation(value, value =>
                                        handleImage(this.props, value, onChange)
                                    );
                                }
                                handleImage(this.props, value, onChange);
                            }}
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
                    )}
                </ChangeConfirm>
                <Bind>
                    <Input placeholder={"Image caption"} name={"caption"} />
                </Bind>
            </React.Fragment>
        );
    }
}

export default createComponent(ImageWidget, { modules: ["Image", "Input", "ChangeConfirm"] });
