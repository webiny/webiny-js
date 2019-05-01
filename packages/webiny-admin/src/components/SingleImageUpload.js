// @flow
import * as React from "react";
import { Image } from "webiny-app/components/Image";
import { Image as UiImage } from "webiny-ui/ImageUpload";
import FileManager from "./FileManager";

type Props = Object;

export default ({ imagePreviewProps, onChange, value, ...fileManagerProps }: Props) => {
    return (
        <FileManager {...fileManagerProps} onChange={onChange}>
            {({ showFileManager }) => (
                <UiImage
                    renderImagePreview={(renderImageProps: Object) => (
                        <Image {...renderImageProps} {...imagePreviewProps} />
                    )}
                    style={{ width: "100%", height: "auto" }}
                    value={value}
                    uploadImage={showFileManager}
                    removeImage={onChange}
                />
            )}
        </FileManager>
    );
};
