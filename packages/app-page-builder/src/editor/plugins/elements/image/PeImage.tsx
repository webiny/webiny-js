import React, { useCallback } from "react";
import { FileManager, SingleImageUploadProps } from "@webiny/app-admin";
import { UpdateElementActionEvent } from "~/editor/recoil/actions";
import pick from "lodash/pick";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { ImageRendererComponent } from "@webiny/app-page-builder-elements/renderers/image";
import { AddImageIconWrapper, AddImageWrapper } from "@webiny/ui/ImageUpload/styled";
import { ReactComponent as AddImageIcon } from "@webiny/ui/ImageUpload/icons/round-add_photo_alternate-24px.svg";
import { Typography } from "@webiny/ui/Typography";
import { useElementVariableValue } from "~/editor/hooks/useElementVariableValue";
import { createRenderer, useRenderer } from "@webiny/app-page-builder-elements";

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

const emptyLink = { href: "" };

const PeImage = createRenderer(() => {
    const { getElement } = useRenderer();
    const element = getElement();
    const variableValue = useElementVariableValue(element);
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

    return (
        <FileManager
            onChange={onChange}
            render={({ showFileManager }) => (
                <ImageRendererComponent
                    onClick={showFileManager}
                    renderEmpty={<RenderBlank onClick={showFileManager} />}
                    value={variableValue}
                    // Even if the link might've been applied via the right sidebar, we still don't
                    // want to have it rendered in the editor. Because, otherwise, user wouldn't be
                    // able to click again on the component and bring back the file manager overlay.
                    link={emptyLink}
                />
            )}
        />
    );
});

export default PeImage;
