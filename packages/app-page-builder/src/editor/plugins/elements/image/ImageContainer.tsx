import React, { useCallback } from "react";
import { useRecoilValue } from "recoil";
import styled from "@emotion/styled";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";
import { PbEditorElement } from "../../../../types";
import { useEventActionHandler } from "../../../hooks/useEventActionHandler";
import { UpdateElementActionEvent } from "../../../recoil/actions";
import { uiAtom } from "../../../recoil/modules";

const AlignImage = styled("div")((props: any) => ({
    img: {
        alignSelf: props.align
    }
}));

type ImageContainerType = {
    element: PbEditorElement;
};
const ImageContainer: React.FunctionComponent<ImageContainerType> = ({ element }) => {
    const { displayMode } = useRecoilValue(uiAtom);
    const handler = useEventActionHandler();
    const {
        id,
        data: { image = {}, settings = {} }
    } = element || {};
    const { horizontalAlignFlex } = settings;
    // Use per-device style
    const align = horizontalAlignFlex[displayMode] || "center";

    const imgStyle = { width: null, height: null };
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
