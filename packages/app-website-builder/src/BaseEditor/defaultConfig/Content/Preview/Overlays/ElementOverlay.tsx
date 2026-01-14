import React, { useCallback } from "react";
import { cn } from "@webiny/admin-ui";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import type { Box } from "../Box.js";
import { $highlightElement, $selectElement } from "~/editorSdk/utils/index.js";
import { Draggable } from "~/BaseEditor/components/Draggable.js";
import { useIsDragging } from "~/BaseEditor/defaultConfig/Content/Preview/useIsDragging.js";
import { useElementComponentManifest } from "~/BaseEditor/defaultConfig/Content/Preview/useElementComponentManifest.js";
import { useStyles } from "~/BaseEditor/defaultConfig/Sidebar/StyleSettings/useStyles.js";

interface ElementOverlayProps {
    elementId: string;
    isSelected: boolean;
    isHighlighted: boolean;
    previewBox: Box;
    editorBox: Box;
}

export const ElementOverlay = React.memo(
    ({ previewBox, elementId, isSelected, isHighlighted }: ElementOverlayProps) => {
        const editor = useDocumentEditor();
        const componentManifest = useElementComponentManifest(previewBox.id);

        const onClick = useCallback((event: React.MouseEvent) => {
            event.stopPropagation();
            $selectElement(editor, elementId);
        }, []);

        const setHighlighted = useCallback((event: React.MouseEvent) => {
            event.stopPropagation();
            $highlightElement(editor, elementId);
        }, []);

        const unsetHighlighted = useCallback((event: React.MouseEvent) => {
            event.stopPropagation();
            $highlightElement(editor, null);
        }, []);

        const dnd = useIsDragging();

        if (!componentManifest) {
            return null;
        }

        const pointerEvents = "auto";
        const componentName = componentManifest.label ?? componentManifest.name;
        const boxState = isSelected ? "active" : isHighlighted && !dnd ? "hover" : null;

        return (
            <Draggable
                type="ELEMENT"
                item={{ id: elementId, componentName: componentManifest.name }}
                canDrag={componentManifest.canDrag !== false}
            >
                {({ isDragging, dragRef }) =>
                    dragRef(
                        <div
                            data-element-id={elementId}
                            onMouseEnter={setHighlighted}
                            onMouseLeave={unsetHighlighted}
                            style={{
                                position: "absolute",
                                pointerEvents,
                                zIndex: 100 + previewBox.depth,
                                top: previewBox.top,
                                left: previewBox.left,
                                width: previewBox.width,
                                height: previewBox.height,
                                opacity: isDragging ? 0.7 : 1
                            }}
                        >
                            <div
                                className={cn(
                                    "absolute box-border text-right top-0 left-0 w-full h-full",
                                    "data-[state=hover]:border-md data-[state=hover]:border-success-default",
                                    "data-[state=active]:border-md data-[state=active]:border-accent-default"
                                )}
                                onClick={onClick}
                                data-state={boxState}
                                data-element-id={elementId}
                                data-role={"element-overlay"}
                                data-depth={previewBox.depth}
                            >
                                {isSelected ? (
                                    <AllMarginStripes
                                        elementId={elementId}
                                        previewBox={previewBox}
                                    />
                                ) : null}
                            </div>
                            <div
                                data-role={"opacity-overlay"}
                                className={"pointer-events-none absolute top-0 left-0 bg-white"}
                                style={{
                                    zIndex: 100 + previewBox.depth,
                                    width: previewBox.width,
                                    height: previewBox.height,
                                    opacity: isDragging ? 0.7 : 0
                                }}
                            ></div>
                            <div
                                data-role={"element-overlay-label"}
                                data-label-for={previewBox.id}
                                data-state={isDragging ? "dragging" : boxState}
                                onClick={onClick}
                                className={cn(
                                    "absolute text-sm text-neutral-light p-xs opacity-0 pointer-events-auto",
                                    "data-[state=hover]:bg-success data-[state=hover]:opacity-100",
                                    "data-[state=active]:bg-primary data-[state=active]:opacity-100",
                                    "data-[state=dragging]:opacity-30"
                                )}
                                style={{ top: -24 }}
                            >
                                {componentName}
                            </div>
                        </div>
                    )
                }
            </Draggable>
        );
    }
);

ElementOverlay.displayName = "ElementOverlay";

interface AllMarginStripesProps {
    elementId: string;
    previewBox: Box;
}

const borderWidth = "var(--border-width-md)";

const AllMarginStripes = ({ elementId, previewBox }: AllMarginStripesProps) => {
    const { styles } = useStyles(elementId);
    const { marginTop = 0, marginBottom = 0, marginLeft = 0, marginRight = 0 } = styles;

    return (
        <>
            {marginTop ? (
                <MarginStripes
                    top={`calc(0px - ${marginTop} - ${borderWidth})`}
                    left={`calc(0px - ${borderWidth})`}
                    height={marginTop}
                    width={`${previewBox.width}px`}
                />
            ) : null}
            {marginRight ? (
                <MarginStripes
                    top={`calc(0px - ${borderWidth})`}
                    left={`calc(${previewBox.width}px - ${borderWidth})`}
                    height={`${previewBox.height}px`}
                    width={marginRight}
                />
            ) : null}
            {marginBottom ? (
                <MarginStripes
                    top={`calc(${previewBox.height}px - ${borderWidth})`}
                    left={`calc(0px - ${borderWidth})`}
                    height={marginBottom}
                    width={`${previewBox.width}px`}
                />
            ) : null}
            {marginLeft ? (
                <MarginStripes
                    top={`calc(0px - ${borderWidth})`}
                    left={`calc(0px - ${marginLeft} - ${borderWidth})`}
                    height={`${previewBox.height}px`}
                    width={marginLeft}
                />
            ) : null}
        </>
    );
};

interface MarginStripesProps {
    top: string;
    left: string;
    height: string;
    width: string;
}

const MarginStripes = ({ top, left, height, width }: MarginStripesProps) => {
    return (
        <div
            data-role={"element-margin"}
            style={{
                pointerEvents: "none",
                position: "absolute",
                top,
                left,
                height,
                width,
                backgroundImage:
                    "linear-gradient(135deg, #ecebff 18.75%, #ffffff 18.75%, #ffffff 50%, #ecebff 50%, #ecebff 68.75%, #ffffff 68.75%, #ffffff 100%)",
                backgroundSize: "4.49px 4.49px"
            }}
        ></div>
    );
};
