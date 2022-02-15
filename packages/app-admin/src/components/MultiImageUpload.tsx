import * as React from "react";
import { Image } from "@webiny/app/components/Image";
import { MultiImageUpload as UiMultiImageUpload } from "@webiny/ui/ImageUpload";

/**
 * TODO @ts-refactor
 */
interface Props {
    imagePreviewProps: {
        src: string;
        [key: string]: any;
    };
    [key: string]: any;
}
const MultiImageUpload: React.FC<Props> = ({ imagePreviewProps, ...multiImageUploadProps }) => {
    return (
        <UiMultiImageUpload
            /**
             * TODO @ts-refactor
             * It appers that renderImagePreview does not exist on  UiMultiImageUpload. So how did this work?
             */
            // @ts-ignore
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
