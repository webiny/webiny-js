import React, { CSSProperties } from "react";
import kebabCase from "lodash/kebabCase";
import Element from "~/render/components/Element";
import { ElementRoot } from "~/render/components/ElementRoot";
import { PbElement } from "~/types";
import ElementAnimation from "~/render/components/ElementAnimation";
import { ClassNames, CSSObject } from "@emotion/react";
import { usePageBuilder } from "~/hooks/usePageBuilder";

interface BlockProps {
    element: PbElement;
}

const Block: React.VFC<BlockProps> = ({ element }) => {
    const {
        responsiveDisplayMode: { displayMode }
    } = usePageBuilder();

    return (
        <>
            {element.data.blockId && (
                <ps-tag data-key={"pb-page-block"} data-value={element.data.blockId} />
            )}
            <ElementAnimation>
                <ElementRoot element={element}>
                    {({ elementStyle, elementAttributes, customClasses, combineClassNames }) => {
                        const containerStyle = elementStyle;
                        // Use per-device style
                        const width =
                            elementStyle[
                                `--${kebabCase(
                                    displayMode
                                )}-align-items` as unknown as keyof CSSProperties
                            ];
                        /**
                         * We're swapping "justifyContent" & "alignItems" value here because
                         * ".webiny-pb-layout-block" has "flex-direction: column"
                         */
                        const alignItems =
                            elementStyle[
                                `--${kebabCase(
                                    displayMode
                                )}-justify-content` as unknown as keyof CSSProperties
                            ];
                        const justifyContent =
                            elementStyle[
                                `--${kebabCase(
                                    displayMode
                                )}-align-items` as unknown as keyof CSSProperties
                            ];

                        // TODO @ts-refactor style type
                        return (
                            <ClassNames>
                                {({ css }) => {
                                    return (
                                        <div
                                            style={{ width: "100%", display: "flex" }}
                                            className={
                                                "webiny-pb-layout-block-container " +
                                                css(containerStyle as CSSObject)
                                            }
                                            {...elementAttributes}
                                        >
                                            <div
                                                style={
                                                    {
                                                        width,
                                                        justifyContent,
                                                        alignItems
                                                    } as any
                                                }
                                                className={combineClassNames(
                                                    "webiny-pb-layout-block webiny-pb-base-page-element-style",
                                                    ...customClasses
                                                )}
                                            >
                                                {element.elements.map((element, index) => (
                                                    <Element
                                                        key={element.id || index}
                                                        element={element}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }}
                            </ClassNames>
                        );
                    }}
                </ElementRoot>
            </ElementAnimation>
        </>
    );
};

export default Block;
