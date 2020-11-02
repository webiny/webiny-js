import React, { useCallback } from "react";
import styled from "@emotion/styled";
import isNumeric from "isnumeric";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { elementWithChildrenByIdSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { useRecoilValue } from "recoil";

const position = { left: "flex-start", center: "center", right: "flex-end" };

const AlignImage = styled("div")((props: any) => ({
    img: {
        alignSelf: position[props.align]
    }
}));

type ImageContainerType = {
    elementId: string;
};
const ImageContainer: React.FunctionComponent<ImageContainerType> = ({ elementId }) => {
    const element = useRecoilValue(elementWithChildrenByIdSelector(elementId));
    const handler = useEventActionHandler();
    const { image = {}, settings = {} } = element.data;
    const { horizontalAlign = "center" } = settings;

    const imgStyle = { width: null, height: null };
    if (image.width) {
        const { width } = image;
        imgStyle.width = isNumeric(width) ? parseInt(width as string) : width;
    }
    if (image.height) {
        const { height } = image;
        imgStyle.height = isNumeric(height) ? parseInt(height as string) : height;
    }

    const onChange = useCallback(
        async (data: string) => {
            handler.trigger(
                new UpdateElementActionEvent({
                    element: {
                        ...element,
                        data: {
                            ...element.data,
                            image: {
                                ...(element.data.image || {}),
                                file: data
                            }
                        }
                    },
                    merge: true
                })
            );
        },
        [elementId]
    );

    return (
        <AlignImage align={horizontalAlign}>
            <SingleImageUpload
                imagePreviewProps={{ style: imgStyle, srcSet: "auto" }}
                onChange={onChange}
                value={image.file}
            />
        </AlignImage>
    );
};

export default React.memo(ImageContainer);
