import React from "react";
import { createRenderer, useRenderer, Elements } from "@webiny/app-page-builder-elements";
import { Element } from "@webiny/app-page-builder-elements/types";
import { SetterOrUpdater, useRecoilValue } from "recoil";
import { elementWithChildrenByIdSelector } from "~/editor/recoil/modules";
import { ReactComponent as AddCircleOutline } from "~/editor/assets/icons/baseline-add_circle-24px.svg";
import { TogglePluginActionEvent } from "~/editor/recoil/actions";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import styled from "@emotion/styled";
import { IconButton } from "@webiny/ui/Button";
import { useActiveElementId } from "~/editor/hooks/useActiveElementId";
import { useElementById } from "~/editor/hooks/useElementById";
import { PbEditorElement } from "~/types";

const EmptyCell = styled.div<{ isActive: boolean }>`
    height: 100%;
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

const PeCell = createRenderer(
    () => {
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

        const elementWithChildren = useRecoilValue(
            elementWithChildrenByIdSelector(element.id)
        ) as Element;

        const onAddClick = () => {
            handler.trigger(
                new TogglePluginActionEvent({
                    name: "pb-editor-toolbar-add-element",
                    params: { id, path, type },
                    closeOtherInGroup: true
                })
            );
        };

        const childrenElements = elementWithChildren?.elements;
        if (Array.isArray(childrenElements) && childrenElements.length > 0) {
            return <Elements element={elementWithChildren} />;
        }

        const { id, path, type } = element;

        return (
            <EmptyCell isActive={isActive || dragEntered}>
                <IconButton
                    className={"addIcon"}
                    icon={<AddCircleOutline />}
                    onClick={onAddClick}
                />
            </EmptyCell>
        );
    },
    {
        baseStyles: { height: "100%", width: "100%" }
    }
);

export default PeCell;
