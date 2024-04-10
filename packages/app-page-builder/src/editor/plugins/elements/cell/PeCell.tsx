import React from "react";
import { createRenderer, useRenderer, Elements } from "@webiny/app-page-builder-elements";
import { Element } from "@webiny/app-page-builder-elements/types";
import { SetterOrUpdater, useRecoilValue } from "recoil";
import { elementWithChildrenByIdSelector } from "~/editor/recoil/modules";
import styled from "@emotion/styled";
import { useActiveElementId } from "~/editor/hooks/useActiveElementId";
import { useElementById } from "~/editor/hooks/useElementById";
import { PbEditorElement } from "~/types";
import { AddElementButton } from "~/editor/plugins/elements/cell/AddElementButton";

const EmptyCell = styled.div<{ isActive: boolean }>`
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

        const childrenElements = elementWithChildren?.elements;
        if (Array.isArray(childrenElements) && childrenElements.length > 0) {
            return <Elements element={elementWithChildren} />;
        }

        return (
            <EmptyCell isActive={isActive || dragEntered}>
                <AddElementButton element={element} />
            </EmptyCell>
        );
    },
    {
        baseStyles: ({ element }) => {
            const styles = {
                height: "100%",
                width: "100%",
                display: "flex",
                flexDirection: "column"
            };
            const size = element.data?.settings?.grid?.size;
            if (typeof size !== "number") {
                return styles;
            }

            styles.width = `${(size / 12) * 100}%`;
            return styles;
        }
    }
);

export default PeCell;
