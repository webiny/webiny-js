import React, { useCallback, useContext, useEffect } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import get from "lodash/get";
import { css } from "emotion";
import { Typography } from "@webiny/ui/Typography";
import { Icon } from "@webiny/ui/Icon";
import { activeElementAtom, elementByIdSelector, uiAtom } from "~/editor/recoil/modules";
import { ReactComponent as VisibilityOffIcon } from "~/editor/assets/icons/visibility_off_24px.svg";
import { useVisibilitySetting } from "~/editor/plugins/elementSettings/property/PropertySettings";
import { ElementTypeContainer } from "./StyledComponents";
import CollapsableList from "./CollapsableList";
import DragBlockIndicator from "./DragBlockIndicator";
import { BLOCK, useMoveBlock, useSortableList } from "./navigatorHooks";
import { NavigatorContext } from "./Navigator";
import { PbEditorElement } from "~/types";

const elementIdStyle = css`
    text-transform: none;
    font-size: 80%;
`;

const ElementVisibilityAction = ({ elementId }: { elementId: string }) => {
    const { updateVisibility } = useVisibilitySetting(elementId);

    return (
        <Icon
            onClick={() => updateVisibility(false)}
            icon={<VisibilityOffIcon />}
            className={"collapsable__header-icon"}
        />
    );
};
interface GetHighlightItemPropsParams {
    dropItemAbove?: boolean;
    isOver?: boolean;
    elementType: string;
}
const getHighlightItemProps = ({
    dropItemAbove,
    isOver,
    elementType
}: GetHighlightItemPropsParams) => {
    if (!isOver || elementType !== BLOCK) {
        return {
            top: false,
            bottom: false
        };
    }
    if (dropItemAbove) {
        return {
            top: true,
            bottom: false
        };
    }
    return {
        top: false,
        bottom: true
    };
};

interface TreeViewItemProps {
    element: PbEditorElement;
    level: number;
    index: number;
    children: React.ReactNode;
}
const TreeViewItem = ({ element, level, children, index }: TreeViewItemProps) => {
    const elementId = element.id;
    const { displayMode } = useRecoilValue(uiAtom);
    const [activeElement, setActiveElementAtomValue] = useRecoilState(activeElementAtom);
    const [elementAtomValue, setElementAtomValue] = useRecoilState(elementByIdSelector(elementId));
    const { refresh, activeElementPath, setActiveElementPath } = useContext(NavigatorContext);
    const { move } = useMoveBlock(elementId);
    // Use "Drag&Drop"
    const {
        ref: dragAndDropRef,
        handlerId,
        isOver,
        dropItemAbove
    } = useSortableList({
        move,
        id: elementId,
        index,
        type: element.type,
        endDrag: () => {
            refresh();
        }
    });
    // Set active element path in context.
    useEffect(() => {
        if (activeElement === elementId) {
            setActiveElementPath(element.path || []);
        }
    }, [activeElement, elementId]);

    const onMouseOver = useCallback(
        (ev: React.MouseEvent): void => {
            if (!element || element.type === "document") {
                return;
            }
            ev.stopPropagation();

            if (elementAtomValue?.isHighlighted) {
                return;
            }
            /**
             * Error is due to the setElementAtomValue thinking it needs the whole element object.
             * It does not because it merges existing state with new one.
             */
            // @ts-expect-error
            setElementAtomValue({ isHighlighted: true });
        },
        [elementId]
    );

    const onMouseOut = useCallback(() => {
        if (!element || element.type === "document") {
            return;
        }
        /**
         * Error is due to the setElementAtomValue thinking it needs the whole element object.
         * It does not because it merges existing state with new one.
         */
        // @ts-expect-error
        setElementAtomValue({ isHighlighted: false });
    }, [elementId]);

    const handleOnClick = useCallback(() => {
        setActiveElementAtomValue(elementId);

        const elementRef = document.getElementById(elementId);
        if (elementRef) {
            elementRef.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [elementId]);

    if (!elementAtomValue) {
        return null;
    }

    const hidden = get(elementAtomValue, `data.settings.visibility.${displayMode}.hidden`, false);
    const contentStyle = isOver && element.type !== BLOCK ? { opacity: 0.5 } : { opacity: 1 };
    const highlightItem = getHighlightItemProps({
        isOver,
        dropItemAbove,
        elementType: element.type
    });

    const elementIdAttribute = element.data?.settings?.property?.id;

    return (
        <CollapsableList
            level={level}
            highlightItem={highlightItem}
            header={
                <ElementTypeContainer
                    onMouseOver={onMouseOver}
                    onMouseOut={onMouseOut}
                    onClick={handleOnClick}
                    ref={dragAndDropRef}
                    data-handler-id={handlerId}
                >
                    <Typography use={"body2"} className={"title"} tag="span">
                        {element.type}
                        {elementIdAttribute && (
                            <p className={elementIdStyle}>{`#${elementIdAttribute}`}</p>
                        )}
                    </Typography>
                    {hidden ? <ElementVisibilityAction elementId={elementId} /> : null}
                    <DragBlockIndicator type={element.type} />
                </ElementTypeContainer>
            }
            disableAction={element.elements.length <= 0}
            active={activeElement === elementId}
            inActivePath={activeElementPath.includes(elementId)}
            style={contentStyle}
        >
            {children as unknown as React.ReactElement}
        </CollapsableList>
    );
};

interface TreeViewProps {
    element: {
        id: string;
        type: string;
        elements: any[];
    };
    level: number;
}

export const TreeView = ({ element, level }: TreeViewProps) => {
    if (!element.id || element.elements.length === 0) {
        return null;
    }

    return (
        <>
            {element.elements.map((item, index) => (
                <TreeViewItem key={item.id} element={item} level={level} index={index}>
                    <TreeView element={item} level={level + 1} />
                </TreeViewItem>
            ))}
        </>
    );
};
