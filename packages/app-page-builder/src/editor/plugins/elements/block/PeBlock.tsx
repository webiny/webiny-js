import React from "react";
import { PbEditorElement } from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import { BlockComponent } from "@webiny/app-page-builder-elements/renderers/block";
import { Element } from "@webiny/app-page-builder-elements/types";
import { useElementById } from "~/editor/hooks/useElementById";
import styled from "@emotion/styled";

interface PeBlockProps {
    element: PbEditorElement;
}

const PeBlock: React.FC<PeBlockProps> = props => {
    const { element } = props;
    const { renderers } = usePageElements();
    const Block = renderers.block as BlockComponent;

    const elements: Array<Element> = [];
    element.elements.forEach(id => {
        const [element] = useElementById(id as string);
        if (element) {
            elements.push(element as Element);
        }
    });

    const EditorBlock = editorr(Block);

    console.log(EditorBlock);
    return <EditorBlock element={element as Element} elements={elements} />;
};

export default PeBlock;

const editorr = (Component: any) => {
    const color = true ? "var(--mdc-theme-primary)" : "var(--mdc-theme-secondary)";

    return styled(Component)(({highlight, color}) => ({
        display: 'block',
        borderRadius: 2,
        boxSizing: "border-box",
        // boxShadow: highlight ? "inset 0px 0px 0px 2px " + color : "none",
        boxShadow: "inset 0px 0px 0px 2px " + color
    }));

    // const StyledComponent = styled(Component)(({ highlight = true, active = true}) => {
    //     const color = active ? "var(--mdc-theme-primary)" : "var(--mdc-theme-secondary)";
    //
    //     return {
    //         /*width: "100%", // removed this because it's breaking positioning when a Row has a fixed width */
    //         position: "relative",
    //         flex: "100%",
    //         padding: 0,
    //         opacity: 1,
    //         borderRadius: 2,
    //         boxSizing: "border-box",
    //         zIndex: 10,
    //         transition: "all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)",
    //         "&::after": {
    //             content: "''",
    //             position: "absolute",
    //             zIndex: 0, // previously it was set to -1, but then background images and other elements would be displayed above
    //             //padding: 0,
    //             top: 0,
    //             left: 0,
    //             width: "calc(100% + 2px)",
    //             height: "calc(100% + 2px)",
    //             pointerEvents: "none",
    //             margin: highlight ? "-2px 0 -2px -2px" : 0,
    //             //padding: highlight ? '0 3px 3px 0px' : 0,
    //             //boxShadow: highlight
    //             //    ? "0px 0px 0px 1px " + color + ", inset 0px 0px 0px 1px " + color
    //             //   : "none",
    //             boxShadow: highlight ? "inset 0px 0px 0px 2px " + color : "none",
    //             transition: "all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)",
    //             opacity: highlight ? 1 : 0
    //         },
    //         "&::after:hover": {
    //             opacity: 1
    //         },
    //         "&:hover": {
    //             "> .innerWrapper > .type": {
    //                 display: highlight ? "block" : "none"
    //             }
    //         },
    //         "> .innerWrapper": {
    //             width: "100%",
    //             height: "100%", // note "auto" fixes the odd hover bug which resizes the column, but causes a bug with column vertical align
    //             boxSizing: "border-box"
    //         },
    //         "> .innerWrapper > .type": {
    //             display: highlight ? "block" : "none",
    //             width: !active ? "100%" : "100px",
    //             height: !active ? "100%" : "18px",
    //             [!active ? "left" : "right"]: !active ? 0 : 0,
    //             position: "absolute",
    //             top: -18, //0,
    //             zIndex: 10,
    //             transition: "background-color 0.2s",
    //             ".background": {
    //                 pointerEvents: highlight ? "auto" : "none",
    //                 display: !active ? "block" : "none",
    //                 position: "absolute",
    //                 width: "100%",
    //                 height: "100%",
    //                 cursor: "pointer",
    //                 top: 17,
    //                 left: 0,
    //                 transition: "background-color 0.2s"
    //             },
    //             ".element-holder": {
    //                 "> span, > svg": {
    //                     backgroundColor: color
    //                 }
    //             }
    //         }
    //     };
    // });
    //
    // return StyledComponent;
};

export const defaultStyle = {
    opacity: 0,
    transform: "scale(0.5)",
    transitionProperty: "opacity, transform",
    transitionTimingFunction: "cubic-bezier(0, 0, .2, 1)",
    transitionDuration: "175ms",
    transitionDelay: "50ms",
    willChange: "opacity, transform"
};

export const transitionStyles: Record<string, any> = {
    entering: { opacity: 0, transform: "scale(0.5)" },
    entered: { opacity: 1, transform: "scale(1)" }
};
