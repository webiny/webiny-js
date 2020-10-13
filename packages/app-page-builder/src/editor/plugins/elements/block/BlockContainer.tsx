import React, { CSSProperties } from "react";
import { dropElementAction } from "@webiny/app-page-builder/editor/recoil/actions/dropElement";
import { elementByIdSelectorFamily } from "@webiny/app-page-builder/editor/recoil/recoil";
import { css } from "emotion";
import Element from "@webiny/app-page-builder/editor/components/Element";
import DropZone from "@webiny/app-page-builder/editor/components/DropZone";
import { useRecoilValue } from "recoil";

type BlockContainerPropsType = {
    elementStyle: CSSProperties;
    elementAttributes: {
        [key: string]: string;
    };
    customClasses: string[];
    combineClassNames: (...styles) => string;
    elementId: string;
};
const BlockContainer: React.FunctionComponent<BlockContainerPropsType> = ({
    elementStyle,
    elementAttributes,
    customClasses,
    combineClassNames,
    elementId
}) => {
    const element = useRecoilValue(elementByIdSelectorFamily(elementId));
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
                            onDrop={source =>
                                dropElementAction({
                                    source,
                                    target: {
                                        id,
                                        type,
                                        position: index
                                    }
                                })
                            }
                        />
                        <Element key={childId} id={childId} />
                        {index === elements.length - 1 && (
                            <DropZone.Below
                                type={type}
                                onDrop={source => {
                                    dropElementAction({
                                        source,
                                        target: {
                                            id,
                                            type,
                                            position: elements.length
                                        }
                                    });
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
