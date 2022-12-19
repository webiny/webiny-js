import React, { useCallback } from "react";
import { PbEditorElement } from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import { FileManager, SingleImageUploadProps } from "@webiny/app-admin";
import { UpdateElementActionEvent } from "~/editor/recoil/actions";
import pick from "lodash/pick";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { ImageRenderer } from "@webiny/app-page-builder-elements/renderers/image";
import { Element } from "@webiny/app-page-builder-elements/types";

import { AddImageIconWrapper, AddImageWrapper } from "@webiny/ui/ImageUpload/styled";
import { ReactComponent as AddImageIcon } from "@webiny/ui/ImageUpload/icons/round-add_photo_alternate-24px.svg";
import { Typography } from "@webiny/ui/Typography";

const RenderBlank = (props: { onClick?: () => void }) => {
    return (
        <AddImageWrapper data-role={"select-image"} onClick={props.onClick}>
            <AddImageIconWrapper>
                <AddImageIcon />
                <Typography use={"caption"}>Select an image</Typography>
            </AddImageIconWrapper>
        </AddImageWrapper>
    );
};

type ImagePropsType = {
    element: PbEditorElement;
    isActive?: boolean;
};

const Image: React.FC<ImagePropsType> = ({ element, isActive }) => {
    const { renderers } = usePageElements();
    const Image = renderers.image as ImageRenderer;

    const handler = useEventActionHandler();

    const id = element?.id;

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

    if (isActive) {
        return (
            <FileManager
                onChange={onChange}
                render={({ showFileManager }) => (
                    <Image
                        element={element as Element}
                        onClick={() => showFileManager()}
                        renderEmpty={<RenderBlank onClick={showFileManager} />}
                    />
                )}
            />
        );
    }

    return <Image element={element as Element} renderEmpty={<RenderBlank />} />;
};

export default Image;
