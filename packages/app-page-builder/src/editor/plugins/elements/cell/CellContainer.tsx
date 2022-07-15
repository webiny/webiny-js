import React from "react";
import Cell from "./Cell";
import DropZone from "~/editor/components/DropZone";
import styled from "@emotion/styled";
import { IconButton } from "@webiny/ui/Button";
import { css } from "emotion";
import { useRecoilValue } from "recoil";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { elementByIdSelector } from "~/editor/recoil/modules";
import { DropElementActionEvent, TogglePluginActionEvent } from "~/editor/recoil/actions";
import { DragObjectWithTypeWithTarget } from "~/editor/components/Droppable";
import { ElementRoot } from "~/render/components/ElementRoot";
import { ReactComponent as AddCircleOutline } from "../../../assets/icons/baseline-add_circle-24px.svg";
import { PbEditorElement } from "~/types";

const CellContainerStyle = styled<"div", { active: boolean }>("div")(({ active }) => ({
    position: "relative",
    color: "#666",
    boxSizing: "border-box",
    flexGrow: 1,
    width: `100%`,
    " > div": {
        width: "100%"
    },
    "&::after": {
        content: '""',
        position: "absolute",
        zIndex: -1,
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        transition: "border 250ms ease-in-out",
        border: active ? "none" : "1px dashed gray"
    }
}));
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

interface CellPropsType {
    elementId: string;
    isActive: boolean;
}
const CellContainer: React.FC<CellPropsType> = ({ elementId, isActive }) => {
    const handler = useEventActionHandler();
    const element = useRecoilValue(elementByIdSelector(elementId));
    const { isHighlighted } = element as PbEditorElement;
    // TODO remove when state is fully switched to use content instead of flat elements
    if (!element) {
        return null;
    }
    const { id, path, elements, type } = element;
    const totalElements = elements.length;

    const onAddClick = () => {
        handler.trigger(
            new TogglePluginActionEvent({
                name: "pb-editor-toolbar-add-element",
                params: { id, path, type },
                closeOtherInGroup: true
            })
        );
    };

    const dropElementAction = (source: DragObjectWithTypeWithTarget, position: number) => {
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
                <CellContainerStyle
                    active={isHighlighted || isActive}
                    style={elementStyle}
                    className={getAllClasses("webiny-pb-base-page-element-style")}
                >
                    {totalElements === 0 && (
                        <DropZone.Center
                            id={id}
                            type={type}
                            isHighlighted={isHighlighted}
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
                                key={childId as string}
                                dropElement={dropElementAction}
                                index={index}
                                type={type}
                                isLast={index === totalElements - 1}
                                id={childId as string}
                            />
                        );
                    })}
                </CellContainerStyle>
            )}
        </ElementRoot>
    );
};

export default React.memo(CellContainer);
