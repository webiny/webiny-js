import React from "react";
import { Elements } from "~/components/Elements";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementRenderer } from "~/types";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-block": any;
            "pb-block-inner": any;
        }
    }
}

const defaultStyles = { display: "block", boxSizing: "border-box" };

const Block: ElementRenderer = ({ element }) => {
    const { getClassNames, getElementClassNames, combineClassNames, getElementStyles } =
        usePageElements();
    const classNames = getClassNames(defaultStyles);
    const [styles] = getElementStyles(element);

    return (
        <pb-block class={classNames}>
            <pb-block-inner
                class={combineClassNames(
                    getElementClassNames(element),
                    getClassNames({
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "column",
                        width: styles.width,
                        /**
                         * We're swapping "justifyContent" & "alignItems" value here because
                         * block has "flex-direction: column" rule applied.
                         */
                        justifyContent: styles.alignItems,
                        alignItems: styles.justifyContent
                    })
                )}
            >
                <Elements element={element} />
            </pb-block-inner>
        </pb-block>
    );
};

export const createBlock = () => Block;
