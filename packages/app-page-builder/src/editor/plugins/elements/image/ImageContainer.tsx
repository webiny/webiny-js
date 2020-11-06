import React, { useCallback } from "react";
import styled from "@emotion/styled";
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
    const { image = {}, settings = {} } = element?.data || {};
    const { horizontalAlign = "center" } = settings;

    const imgStyle = { width: null, height: null };
    if (image.width) {
        const { width } = image;
        imgStyle.width = parseInt(width as string);
    }
    if (image.height) {
        const { height } = image;
        imgStyle.height = parseInt(height as string);
    }

    const onChange = useCallback(
        async (data: { [key: string]: string }) => {
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
    // required due to re-rendering when set content atom and still nothing in elements atom
    if (!element) {
        return null;
    }

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
