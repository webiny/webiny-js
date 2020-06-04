import * as React from "react";
import { Image } from "@webiny/app/components/Image";
import { MultiImageUpload as UiMultiImageUpload } from "@webiny/ui/ImageUpload";

// TODO: @adrian define props type
type Props = any;

export default function MultiImageUpload({ imagePreviewProps, ...multiImageUploadProps }: Props) {
    return (
        <UiMultiImageUpload
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
}
