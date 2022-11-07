import React, { useCallback, useMemo } from "react";
import { useRecoilValue } from "recoil";
import styled from "@emotion/styled";
import get from "lodash/get";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";
import { PbEditorElement, PbElementDataImageType } from "~/types";
import { uiAtom } from "~/editor/recoil/modules";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { UpdateElementActionEvent } from "~/editor/recoil/actions";
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

export default makeComposable(
    "ImageContainer",
    React.memo(({ element }: { element: PbEditorElement }) => {
        return <ImageContainer element={element} />;
    })
);
