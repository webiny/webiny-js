import { useEventActionHandler } from "@webiny/app-page-builder/editor/provider";
import React, { CSSProperties } from "react";
import Element from "@webiny/app-page-builder/editor/components/Element";
import DropZone from "@webiny/app-page-builder/editor/components/DropZone";
import { css } from "emotion";
import { DropElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { elementByIdSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { useRecoilValue } from "recoil";

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
    const element = useRecoilValue(elementByIdSelector(elementId));
    const eventActionHandler = useEventActionHandler();
    const { id, type, elements } = element;

    const { width, alignItems, justifyContent, ...containerStyle } = elementStyle;

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
                                                position: elements.length
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
