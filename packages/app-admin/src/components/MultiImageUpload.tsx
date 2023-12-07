import * as React from "react";
import { Image } from "@webiny/app/components/Image";
import { MultiImageUpload as UiMultiImageUpload } from "@webiny/ui/ImageUpload";

/**
 * TODO @ts-refactor
 */
interface MultiImageUploadProps {
    imagePreviewProps: {
        src: string;
        [key: string]: any;
    };
    [key: string]: any;
}
const MultiImageUpload = ({
    imagePreviewProps,
    ...multiImageUploadProps
}: MultiImageUploadProps) => {
    return (
        <UiMultiImageUpload
            /**
             * TODO @ts-refactor
             * It appears that renderImagePreview does not exist on  UiMultiImageUpload. So how did this work?
             */
            // @ts-expect-error
            renderImagePreview={(renderImageProps: Record<string, any>) => {
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
export default MultiImageUpload;
