import React, { useCallback, useMemo } from "react";
import { useRecoilValue } from "recoil";
import styled from "@emotion/styled";
import { SingleImageUpload, SingleImageUploadProps } from "@webiny/app-admin";
import get from "lodash/get";
import { PbEditorElement, PbElementDataImageType } from "~/types";
import { uiAtom } from "~/editor/recoil/modules";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { UpdateElementActionEvent } from "~/editor/recoil/actions";
import pick from "lodash/pick";
import { makeComposable } from "@webiny/react-composition";
import { applyFallbackDisplayMode } from "~/editor/plugins/elementSettings/elementSettingsUtils";

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

    const id = element?.id;
    const image = element?.data?.image || {};

    // Use per-device style
    const align = useMemo(() => {
        const elementValue = get(element, `data.settings.horizontalAlignFlex.${displayMode}`);

        if (elementValue) {
            return elementValue;
        }

        const fallbackValue = applyFallbackDisplayMode(displayMode, mode =>
            get(element, `data.settings.horizontalAlignFlex.${mode}`)
        );

        if (fallbackValue) {
            return fallbackValue;
        }

        return "center";
    }, [displayMode, element]);

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

export default makeComposable(
    "ImageContainer",
    React.memo(({ element }: { element: PbEditorElement }) => {
        return <ImageContainer element={element} />;
    })
);
