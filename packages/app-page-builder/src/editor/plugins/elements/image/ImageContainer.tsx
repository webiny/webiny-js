import React, { useCallback } from "react";
import { useRecoilValue } from "recoil";
import styled from "@emotion/styled";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";
import { PbEditorElement, PbElementDataImageType } from "~/types";
import { uiAtom } from "~/editor/recoil/modules";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { UpdateElementActionEvent } from "~/editor/recoil/actions";

const AlignImage = styled("div")((props: any) => ({
    img: {
        alignSelf: props.align
    }
}));

interface ImageContainerType {
    element: PbEditorElement;
}
const ImageContainer: React.FC<ImageContainerType> = ({ element }) => {
    const { displayMode } = useRecoilValue(uiAtom);
    const handler = useEventActionHandler();
    const {
        id,
        data: { image = {}, settings = {} }
    } = element || {};
    const { horizontalAlignFlex } = settings;
    // Use per-device style
    /**
     * Figure out better type.
     */
    // TODO @ts-refactor
    const align = horizontalAlignFlex[displayMode as any] || "center";

    const imgStyle: PbElementDataImageType = {
        width: null,
        height: null
    };
    if (image.width) {
        const { width } = image;
        imgStyle.width = width;
    }
    if (image.height) {
        const { height } = image;
        imgStyle.height = height;
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
                    history: true
                })
            );
        },
        [id]
    );
    // required due to re-rendering when set content atom and still nothing in elements atom
    if (!element) {
        return null;
    }

    return (
        <AlignImage align={align}>
            <SingleImageUpload
                imagePreviewProps={{ style: imgStyle, srcSet: "auto" }}
                onChange={onChange}
                value={image.file}
            />
        </AlignImage>
    );
};

export default React.memo(ImageContainer);
