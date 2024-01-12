import React from "react";
import { SetterOrUpdater } from "recoil";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as AddCircleOutline } from "~/editor/assets/icons/baseline-add_circle-24px.svg";
import { TogglePluginActionEvent } from "~/editor/recoil/actions";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import styled from "@emotion/styled";
import { useActiveElementId } from "~/editor/hooks/useActiveElementId";
import { useElementById } from "~/editor/hooks/useElementById";
import { PbEditorElement } from "~/types";

const EmptyCellStyled = styled.div<{ isActive: boolean }>`
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    width: 100%;
    border: ${props =>
        props.isActive
            ? "1px dashed var(--mdc-theme-primary)"
            : "1px dashed var(--mdc-theme-secondary)"};
    align-items: center;

    button {
        color: ${props =>
            props.isActive ? "var(--mdc-theme-primary)" : "var(--mdc-theme-secondary)"};
        transition: transform 0.2s;

        &:hover {
            transform: scale(1.3);
        }
    }
`;

interface EmptyCellProps {
    element: PbEditorElement;
}

const EmptyCell = ({ element }: EmptyCellProps) => {
    const [activeElementId] = useActiveElementId();
    const handler = useEventActionHandler();
    const isActive = activeElementId === element.id;

    const [editorElement] = useElementById(element.id) as [
        PbEditorElement,
        SetterOrUpdater<PbEditorElement>
    ];

    const dragEntered = editorElement.dragEntered;

    const onAddClick = () => {
        handler.trigger(
            new TogglePluginActionEvent({
                name: "pb-editor-toolbar-add-element",
                params: { id, path, type },
                closeOtherInGroup: true
            })
        );
    };

    const { id, path, type } = element;
    return (
        <EmptyCellStyled isActive={isActive || dragEntered}>
            <IconButton icon={<AddCircleOutline />} onClick={onAddClick} />
        </EmptyCellStyled>
    );
};

export default EmptyCell;
