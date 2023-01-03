import React from "react";
import { createRenderer, useRenderer, Elements } from "@webiny/app-page-builder-elements";
import { Element } from "@webiny/app-page-builder-elements/types";
import { useRecoilValue } from "recoil";
import { elementWithChildrenByIdSelector } from "~/editor/recoil/modules";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as AddCircleOutline } from "~/editor/assets/icons/baseline-add_circle-24px.svg";
import { TogglePluginActionEvent } from "~/editor/recoil/actions";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import styled from "@emotion/styled";

const EmptyCell = styled.div`
    height: 100px;
    display: flex;
    justify-content: center;
    width: 100%;
    border: 1px dashed var(--mdc-theme-secondary);
    pointer-events: none;
    align-items: center;

    button {
      color: var(--mdc-theme-secondary);
      transition: transform 0.2s;

      &:hover {
        transform: scale(1.3);
      }
    }
`;

const PeBlock = createRenderer(
    () => {
        const { getElement } = useRenderer();
        const element = getElement();
        const handler = useEventActionHandler();

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
            <EmptyCell>
                <IconButton icon={<AddCircleOutline />} onClick={onAddClick} />
            </EmptyCell>
        );
    },
    {
        baseStyles: {
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            boxSizing: "border-box"
        }
    }
);

export default PeBlock;
