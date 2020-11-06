import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import React from "react";
import Cell from "./Cell";
import DropZone from "@webiny/app-page-builder/editor/components/DropZone";
import styled from "@emotion/styled";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { ReactComponent as AddCircleOutline } from "@webiny/app-page-builder/editor/assets/icons/baseline-add_circle-24px.svg";
import { DragObjectWithTypeWithTargetType } from "@webiny/app-page-builder/editor/components/Droppable";
import {
    DropElementActionEvent,
    TogglePluginActionEvent
} from "@webiny/app-page-builder/editor/recoil/actions";
import { elementByIdSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { IconButton } from "@webiny/ui/Button";
import { css } from "emotion";
import { useRecoilValue } from "recoil";

const CellContainerStyle = styled("div")({
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
    elementId: string;
};
const CellContainer: React.FunctionComponent<CellPropsType> = ({ elementId }) => {
    const handler = useEventActionHandler();
    const element = useRecoilValue(elementByIdSelector(elementId));
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
        <ElementRoot element={element}>
            {({ getAllClasses, elementStyle }) => (
                <CellContainerStyle style={elementStyle} className={getAllClasses()}>
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
                            <Cell
                                key={childId}
                                dropElement={dropElementAction}
                                index={index}
                                type={type}
                                isLast={index === totalElements - 1}
                                id={childId}
                            />
                        );
                    })}
                </CellContainerStyle>
            )}
        </ElementRoot>
    );
};

export default React.memo(CellContainer);
