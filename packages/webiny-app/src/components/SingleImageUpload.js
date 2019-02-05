// @flow
import * as React from "react";
import { Image } from "./Image";
import { SingleImageUpload } from "webiny-ui/ImageUpload";

type Props = Object;

export default ({ imagePreviewProps, ...singleImageUploadProps }: Props) => {
    return (
        <SingleImageUpload
            renderImagePreview={(renderImageProps: Object) => (
                <Image {...imagePreviewProps} {...renderImageProps} />
            )}
            {...singleImageUploadProps}
        />
    );
};
