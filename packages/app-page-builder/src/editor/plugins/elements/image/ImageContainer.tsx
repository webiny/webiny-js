import React, { useCallback } from "react";
import { useRecoilValue } from "recoil";
import styled from "@emotion/styled";
import { SingleImageUpload, SingleImageUploadProps } from "@webiny/app-admin";
import {
    DisplayMode,
    PbEditorElement,
    PbElementDataImageType,
    PbElementDataSettingsType
} from "~/types";
import { uiAtom } from "~/editor/recoil/modules";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { UpdateElementActionEvent } from "~/editor/recoil/actions";
import pick from "lodash/pick";

const AlignImage = styled("div")((props: any) => ({
    img: {
        alignSelf: props.align
    }
}));

const getHorizontalAlignFlexAlign = (
    element: PbEditorElement | null,
    displayMode: DisplayMode
): PbElementDataSettingsType["horizontalAlignFlex"] => {
    if (!element || !element.data || !element.data.settings) {
        return "center";
    }
    return (element.data.settings.horizontalAlignFlex as any)[displayMode] || "center";
};

interface ImageContainerType {
    element: PbEditorElement;
}

const ImageContainer: React.FC<ImageContainerType> = ({ element }) => {
    const { displayMode } = useRecoilValue(uiAtom);
    const handler = useEventActionHandler();

    const id = element?.id;
    const image = element?.data?.image || {};

    // Use per-device style
    const align = getHorizontalAlignFlexAlign(element, displayMode);

    const imgStyle: PbElementDataImageType = {};
    if (!!image.width) {
        const { width } = image;
        imgStyle.width = width;
    }
    if (!!image.height) {
        const { height } = image;
        imgStyle.height = height;
    }

    const onChange = useCallback<NonNullable<SingleImageUploadProps["onChange"]>>(
        file => {
            handler.trigger(
                new UpdateElementActionEvent({
                    element: {
                        ...element,
                        data: {
                            ...element.data,
                            image: {
                                ...(element.data.image || {}),
                                file: file ? pick(file, ["id", "src"]) : undefined
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
