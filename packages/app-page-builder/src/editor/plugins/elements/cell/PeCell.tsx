import React from "react";
import { createRenderer, useRenderer, Elements } from "@webiny/app-page-builder-elements";
import { Element } from "@webiny/app-page-builder-elements/types";
import { useRecoilValue } from "recoil";
import { elementWithChildrenByIdSelector } from "~/editor/recoil/modules";
import { ReactComponent as AddCircleOutline } from "~/editor/assets/icons/baseline-add_circle-24px.svg";
import { TogglePluginActionEvent } from "~/editor/recoil/actions";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import styled from "@emotion/styled";
import { IconButton } from "@webiny/ui/Button";
import {useActiveElementId} from "~/editor/hooks/useActiveElementId";

const EmptyCell = styled.div<{ isActive: boolean }>`
    height: 100%;
    display: flex;
    justify-content: center;
    width: 100%;
    border: 1px dashed var(--mdc-theme-secondary);
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
            <EmptyCell isActive={isActive}>
                <IconButton
                    className={"addIcon"}
                    icon={<AddCircleOutline />}
                    onClick={onAddClick}
                />
            </EmptyCell>
        );
    },
    {
        baseStyles: ({ element }) => {
            const styles = { height: "100%", width: "100%" };
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
