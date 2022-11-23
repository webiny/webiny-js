import React, { useCallback } from "react";
import { PbEditorElement } from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import { SingleImageUpload, SingleImageUploadProps } from "@webiny/app-admin";
import { UpdateElementActionEvent } from "~/editor/recoil/actions";
import pick from "lodash/pick";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";

type ImagePropsType = {
    element: PbEditorElement;
};

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-image": any;
        }
    }
}

const Image: React.FC<ImagePropsType> = ({ element }) => {
    const { getClassNames, getElementClassNames, combineClassNames } = usePageElements();
    const classNames = combineClassNames(
        // The Image page element has its width/height stored in a non-standard way.
        getClassNames({
            display: "block",
            width: element.data.image?.width,
            height: element.data.image?.height
        }),
        getElementClassNames(element as any)
    );

    const handler = useEventActionHandler();

    const id = element?.id;
    const image = element?.data?.image || {};

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

    return (
        <pb-image>
            <SingleImageUpload
                imagePreviewProps={{ srcSet: "auto", className: classNames, style: {} }}
                onChange={onChange}
                value={image.file}
            />
        </pb-image>
    );
};

export default Image;
