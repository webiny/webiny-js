import React, { useCallback } from "react";
import { PbEditorElement } from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import { FileManager, SingleImageUploadProps } from "@webiny/app-admin";
import { UpdateElementActionEvent } from "~/editor/recoil/actions";
import pick from "lodash/pick";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { ImageComponent } from "@webiny/app-page-builder-elements/renderers/image";
import { Element } from "@webiny/app-page-builder-elements/types";

type ImagePropsType = {
    element: PbEditorElement;
    isActive?: boolean;
};

const Image: React.FC<ImagePropsType> = ({ element, isActive }) => {
    const { renderers } = usePageElements();
    const Image = renderers.image as ImageComponent;

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
                    <Image element={element as Element} onClick={() => showFileManager()} />
                )}
            />
        );
    }
    return <Image element={element as Element} />;
};

export default Image;
