// @flow
import * as React from "react";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";

export type RenderPropParams = {
    getImgProps: (props: ?Object) => Object,
    getDataURL: () => ?string,
    cropper: Cropper
};

type Props = {
    children: RenderPropParams => React.Node
};

class ImageCropper extends React.Component<Props> {
    imageRef = React.createRef();
    cropper: ?Cropper = null;

    componentDidMount() {
        this.cropper = new Cropper(this.imageRef, this.props);
    }

    componentWillUnmount() {
        this.cropper && this.cropper.destroy();
    }

    render() {
        return this.props.children({
            cropper: this.cropper,
            getImgProps: (props: ?Object) => {
                return {
                    ...props,
                    ref: ref => (this.imageRef = ref)
                };
            },
            getDataURL: () => {
                if (this.cropper) {
                    return this.cropper.getCroppedCanvas().toDataURL();
                }
                return null;
            }
        });
    }
}

export { ImageCropper };
