import { ReactComponent as AddCircleOutline } from "@webiny/app-page-builder/editor/assets/icons/baseline-add_circle-24px.svg";
import { DragObjectWithTypeWithTargetType } from "@webiny/app-page-builder/editor/components/Droppable";
import { useEventActionHandler } from "@webiny/app-page-builder/editor/provider";
import { IconButton } from "@webiny/ui/Button";
import React, { CSSProperties } from "react";
import Element from "@webiny/app-page-builder/editor/components/Element";
import DropZone from "@webiny/app-page-builder/editor/components/DropZone";
import { css } from "emotion";
import {
    DropElementActionEvent,
    TogglePluginActionEvent
} from "@webiny/app-page-builder/editor/recoil/actions";
import { elementByIdSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { useRecoilValue } from "recoil";

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

type BlockContainerPropsType = {
    combineClassNames: (...classes: string[]) => string;
    elementStyle: CSSProperties;
    elementAttributes: { [key: string]: string };
    customClasses: string[];
    elementId: string;
};
const BlockContainer: React.FunctionComponent<BlockContainerPropsType> = ({
    elementStyle,
    elementAttributes,
    customClasses,
    combineClassNames,
    elementId
}) => {
    const handler = useEventActionHandler();
    const element = useRecoilValue(elementByIdSelector(elementId));
    const eventActionHandler = useEventActionHandler();
    const { id, path, type, elements } = element;

    const { width, alignItems, justifyContent, ...containerStyle } = elementStyle;

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

    const totalElements = elements.length;
    return (
        <div
            style={{ width: "100%", display: "flex", justifyContent: "center" }}
            className={"webiny-pb-layout-block-container " + css(containerStyle as any)}
            {...elementAttributes}
        >
            <div
                style={{
                    width: width ? width : "100%",
                    alignSelf: justifyContent,
                    alignItems: alignItems
                }}
                className={combineClassNames(...customClasses)}
            >
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
                {elements.map((childId, index) => (
                    <React.Fragment key={childId}>
                        <DropZone.Above
                            type={type}
                            onDrop={source => () => {
                                eventActionHandler.trigger(
                                    new DropElementActionEvent({
                                        source,
                                        target: {
                                            id,
                                            type,
                                            position: index
                                        }
                                    })
                                );
                            }}
                        />
                        <Element key={childId} id={childId} />
                        {index === elements.length - 1 && (
                            <DropZone.Below
                                type={type}
                                onDrop={source => {
                                    eventActionHandler.trigger(
                                        new DropElementActionEvent({
                                            source,
                                            target: {
                                                id,
                                                type,
                                                position: totalElements
                                            }
                                        })
                                    );
                                }}
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default React.memo(BlockContainer);
