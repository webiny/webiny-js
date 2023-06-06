import React from "react";
import { createRenderer, useRenderer, Elements } from "@webiny/app-page-builder-elements";
import { useEventActionHandler } from "@webiny/app-page-builder/editor/hooks/useEventActionHandler";
import styled from "@emotion/styled";
import { SetterOrUpdater, useRecoilValue } from "recoil";
import { PbEditorElement } from "@webiny/app-page-builder/types";
import { useElementById } from "@webiny/app-page-builder/editor/hooks/useElementById";
import { elementWithChildrenByIdSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { TogglePluginActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { useActiveElementId } from "@webiny/app-page-builder/editor/hooks/useActiveElementId";
import { ReactComponent as AddCircleOutline } from "@webiny/app-page-builder/editor/assets/icons/baseline-add_circle-24px.svg";
import { IconButton } from "@webiny/ui/Button";
import { Element } from "@webiny/app-page-builder-elements/types";

const primaryColor = "var(--mdc-theme-primary)";
const secondaryColor = "var(--mdc-theme-secondary)";

const EmptyCell = styled.div<{ isActive: boolean }>`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
    border: 1px dashed ${props => (props.isActive ? primaryColor : secondaryColor)};

    button {
        color: ${props => (props.isActive ? primaryColor : secondaryColor)};
        transition: transform 0.2s;

        &:hover {
            transform: scale(1.3);
        }
    }
`;

// The renderer React component.
export const ContentGalleryDropzone = createRenderer(() => {
    const { getElement } = useRenderer();
    const element = getElement();

    const handler = useEventActionHandler();
    const [activeElementId] = useActiveElementId();
    const isActive = activeElementId === element.id;

    const [editorElement] = useElementById(element.id) as [
        PbEditorElement,
        SetterOrUpdater<PbEditorElement>
    ];

    const dragEntered = editorElement.dragEntered;

    const onAddClick = () => {
        const { id, path, type } = element;
        handler.trigger(
            new TogglePluginActionEvent({
                name: "pb-editor-toolbar-add-element",
                params: { id, path, type },
                closeOtherInGroup: true
            })
        );
    };

    const elementWithChildren = useRecoilValue(
        elementWithChildrenByIdSelector(element.id)
    ) as Element;

    console.log('elementWithChildren', elementWithChildren)

    return (
        <>
            <Elements element={elementWithChildren} />
            {elementWithChildren.elements.length === 0 && (
                <EmptyCell isActive={isActive || dragEntered}>
                    <IconButton
                        className={"addIcon"}
                        icon={<AddCircleOutline />}
                        onClick={onAddClick}
                    />
                </EmptyCell>
            )}
        </>
    );
});
