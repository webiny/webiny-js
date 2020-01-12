import * as React from "react";
import { Image } from "@webiny/app/components/Image";
import { MultiImageUpload } from "@webiny/ui/ImageUpload";

// TODO: @adrian define props type
type Props = any;

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
