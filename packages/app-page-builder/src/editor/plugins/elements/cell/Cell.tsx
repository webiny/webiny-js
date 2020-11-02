import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { ReactComponent as AddCircleOutline } from "@webiny/app-page-builder/editor/assets/icons/baseline-add_circle-24px.svg";
import { DragObjectWithTypeWithTargetType } from "@webiny/app-page-builder/editor/components/Droppable";
import DropZone from "@webiny/app-page-builder/editor/components/DropZone";
import {
    DropElementActionEvent,
    TogglePluginActionEvent
} from "@webiny/app-page-builder/editor/recoil/actions";
import { IconButton } from "@webiny/ui/Button";
import { css } from "emotion";
import React from "react";
import Element from "@webiny/app-page-builder/editor/components/Element";
import styled from "@emotion/styled";
import { PbShallowElement } from "@webiny/app-page-builder/types";

const CellStyle = styled("div")({
    position: "relative",
    color: "#666",
    padding: 5,
    boxSizing: "border-box",
    flexGrow: 1,
    width: `100%`,
    border: "1px dashed gray",
    " > div": {
        width: "100%"
    }
});
const addIcon = css({
    color: "var(--mdc-theme-secondary)",
    transition: "transform 0.2s",
    "&:hover": {
        transform: "scale(1.3)"
    },
    "&::before, &::after": {
        display: "none"
    }
});

type CellPropsType = {
    element: PbShallowElement;
};
const Cell: React.FunctionComponent<CellPropsType> = ({ element }) => {
    const handler = useEventActionHandler();
    const { id, path, elements, type } = element;
    const totalElements = elements.length;

    const onAddClick = () => {
        handler.trigger(
            new TogglePluginActionEvent({
                name: "pb-editor-toolbar-add-element",
                params: { id, path, type }
            })
        );
    };

    const dropElementAction = (source: DragObjectWithTypeWithTargetType, position: number) => {
        handler.trigger(
            new DropElementActionEvent({
                source,
                target: {
                    id,
                    type,
                    position
                }
            })
        );
    };
    return (
        <CellStyle>
            {totalElements === 0 && (
                <DropZone.Center
                    id={id}
                    type={type}
                    onDrop={source => dropElementAction(source, 0)}
                >
                    <IconButton
                        className={addIcon + " addIcon"}
                        icon={<AddCircleOutline />}
                        onClick={onAddClick}
                    />
                </DropZone.Center>
            )}
            {elements.map((childId, index) => {
                return (
                    <>
                        <DropZone.Above
                            type={type}
                            onDrop={source => dropElementAction(source, index)}
                        />
                        <Element key={childId} id={childId} />
                        {index === elements.length - 1 && (
                            <DropZone.Below
                                type={type}
                                onDrop={source => dropElementAction(source, totalElements)}
                            />
                        )}
                    </>
                );
            })}
        </CellStyle>
    );
};

export default React.memo(Cell, (prev, next) => {
    return prev.element.id === next.element.id;
});
