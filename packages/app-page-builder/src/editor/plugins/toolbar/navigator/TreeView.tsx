import React, { useCallback } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import get from "lodash/get";
import { Typography } from "@webiny/ui/Typography";
import { activeElementAtom, elementByIdSelector, uiAtom } from "~/editor/recoil/modules";
import { ElementTypeContainer } from "./StyledComponents";
import CollapsableList from "./CollapsableList";

const TreeViewItem = ({ element, level, children }) => {
    const elementId = element.id;
    const { displayMode } = useRecoilValue(uiAtom);
    const [activeElement, setActiveElementAtomValue] = useRecoilState(activeElementAtom);
    const [{ isHighlighted, data: elementData }, setElementAtomValue] = useRecoilState(
        elementByIdSelector(elementId)
    );

    const onMouseOver = useCallback(
        (ev): void => {
            if (!element || element.type === "document") {
                return;
            }
            ev.stopPropagation();
            if (isHighlighted) {
                return;
            }
            setElementAtomValue({ isHighlighted: true } as any);
        },
        [elementId]
    );

    const onMouseOut = useCallback(() => {
        if (!element || element.type === "document") {
            return;
        }
        setElementAtomValue({ isHighlighted: false } as any);
    }, [elementId]);

    const activateElement = useCallback((id: string) => {
        setActiveElementAtomValue(id);
    }, []);

    const hidden = get(elementData, `settings.visibility.${displayMode}.hidden`, false);

    return (
        <CollapsableList
            level={level}
            header={
                <ElementTypeContainer
                    onMouseOver={onMouseOver}
                    onMouseOut={onMouseOut}
                    onClick={() => activateElement(elementId)}
                >
                    <Typography use={"subtitle2"}>{element.type}</Typography>
                </ElementTypeContainer>
            }
            disableAction={element.elements.length <= 0}
            active={activeElement === elementId}
            hidden={hidden}
        >
            {children}
        </CollapsableList>
    );
};

type TreeViewProps = {
    element: { id: string; type: string; elements: any[] };
    level: number;
};

export const TreeView = ({ element, level }: TreeViewProps) => {
    if (!element.id || element.elements.length === 0) {
        return null;
    }

    return (
        <>
            {element.elements.map(item => (
                <TreeViewItem key={item.id} element={item} level={level}>
                    <TreeView element={item} level={level + 1} />
                </TreeViewItem>
            ))}
        </>
    );
};
