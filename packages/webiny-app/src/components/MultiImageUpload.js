// @flow
import * as React from "react";
import { Image } from "./Image";
import { MultiImageUpload } from "webiny-ui/ImageUpload";

type Props = Object;

export default ({ imagePreviewProps, ...multiImageUploadProps }: Props) => {
    return (
        <MultiImageUpload
            renderImagePreview={(renderImageProps: Object) => {
                return (
                    <Image
                        transform={{ width: 300 }}
                        {...imagePreviewProps}
                        {...renderImageProps}
                    />
                );
            }}
            {...multiImageUploadProps}
        />
    );
};
