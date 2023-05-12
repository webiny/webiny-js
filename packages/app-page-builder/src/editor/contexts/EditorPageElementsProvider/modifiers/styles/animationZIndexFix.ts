import { ElementAttributesModifier } from "@webiny/app-page-builder-elements/types";

/**
 * This styles modifier adds additional `z-index: 1` CSS rule to all elements
 * that have animation enabled for them. Without this, users would not be able
 * to properly interact with those elements. Not being able to edit the text
 * of a child paragraph text element, not being able to drop an element below
 * an existing one, are just some of the symptoms that users would experience.
 */
export const createAnimationZIndexFix = () => {
    const animation: ElementAttributesModifier = ({ element }) => {
        const animation = element.data.settings?.animation;
        if (animation) {
            return { zIndex: 1 };
        }
        return null;
    };

    return animation;
};
