import React, { useCallback } from "react";
import { cn } from "@webiny/admin-ui";
import { useDocumentEditor } from "~/DocumentEditor";
import { Box } from "../Box";
import { $selectElement } from "~/editorSdk/utils";
import { Draggable } from "~/BaseEditor/components/Draggable";
import { useIsDragging } from "~/BaseEditor/defaultConfig/Content/Preview/useIsDragging";
import { useElementComponentManifest } from "~/BaseEditor/defaultConfig/Content/Preview/useElementComponentManifest";
import { useStyles } from "~/BaseEditor/defaultConfig/Sidebar/StyleSettings/useStyles";

interface ElementOverlayProps {
    elementId: string;
    isSelected: boolean;
    isHighlighted: boolean;
    previewBox: Box;
    editorBox: Box;
    children: React.ReactNode;
}

export const ElementOverlay = React.memo(
    ({ previewBox, elementId, isSelected, isHighlighted, children }: ElementOverlayProps) => {
        const editor = useDocumentEditor();
        const componentManifest = useElementComponentManifest(previewBox.id);

        const onClick = useCallback((event: React.MouseEvent) => {
            event.stopPropagation();
            $selectElement(editor, elementId);
        }, []);

        const dnd = useIsDragging();

        if (!componentManifest) {
            return null;
        }

        const pointerEvents = isSelected || isHighlighted ? "auto" : "none";
        const componentName = componentManifest.label ?? componentManifest.name;
        const boxState = isSelected ? "active" : isHighlighted && !dnd ? "hover" : null;
        const isVisible = (isHighlighted && !dnd) || isSelected;

        return (
            <Draggable
                type="ELEMENT"
                item={{ id: elementId, componentName: componentManifest.name }}
                canDrag={componentManifest.canDrag !== false}
            >
                {({ isDragging, dragRef }) =>
                    dragRef(
                        <div>
                            <div
                                className={cn(
                                    "wby-absolute wby-box-border wby-text-right",
                                    "data-[state=hover]:wby-border-md data-[state=hover]:wby-border-success-default",
                                    "data-[state=active]:wby-border-md data-[state=active]:wby-border-accent-default"
                                )}
                                onClick={onClick}
                                data-state={boxState}
                                data-element-id={elementId}
                                data-role={"element-overlay"}
                                data-depth={previewBox.depth}
                                style={{
                                    zIndex: 100 + previewBox.depth,
                                    top: previewBox.top,
                                    left: previewBox.left,
                                    width: previewBox.width,
                                    height: previewBox.height,
                                    pointerEvents
                                }}
                            >
                                {isSelected ? (
                                    <AllMarginStripes
                                        elementId={elementId}
                                        previewBox={previewBox}
                                    />
                                ) : null}
                                {children}
                            </div>
                            <div
                                data-role={"opacity-overlay"}
                                style={{
                                    position: "absolute",
                                    zIndex: 100 + previewBox.depth,
                                    top: previewBox.top,
                                    left: previewBox.left,
                                    width: previewBox.width,
                                    height: previewBox.height,
                                    backgroundColor: "white",
                                    opacity: isDragging ? 0.7 : 0
                                }}
                            ></div>
                            <div
                                data-role={"element-overlay-label"}
                                data-label-for={previewBox.id}
                                data-state={boxState}
                                className={cn(
                                    "wby-absolute wby-text-sm wby-text-neutral-light wby-p-xs",
                                    "data-[state=hover]:wby-bg-success-default",
                                    "data-[state=active]:wby-bg-primary-default"
                                )}
                                style={{
                                    pointerEvents: "auto",
                                    zIndex: 100 + previewBox.depth,
                                    top: previewBox.top - 24,
                                    left: previewBox.left,
                                    opacity: isDragging ? 0.3 : isVisible ? 1 : 0
                                }}
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
