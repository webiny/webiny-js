import React from "react";
import { Elements } from "~/components/Elements";
import { Element, Renderer } from "~/types";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

export interface BlockComponentProps {
    element: Element;
    elements?: Array<Element>;
    className?: string;
}

export type BlockComponent = Renderer<BlockComponentProps>;

interface Props {
    elements?: Element[];
}

export const createBlock = () => {
    return createRenderer(
        (props: Props) => {
            const { getElement, getAttributes } = useRenderer();

            const element = getElement();
            return (
                <div {...getAttributes()}>
                    <Elements element={element} elements={props.elements} />
                </div>
            );
        },
        {
            getBaseStyles: () => ({
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "flex-start",
                boxSizing: "border-box"
            })
        }
    );
};

// const editorr = (Component: any) => {
//     return styled(Component)(({ active = false }: any) => {
//         const activeColor = "var(--mdc-theme-primary)";
//         const hoverColor = "var(--mdc-theme-secondary)";
//
//         const styles = {
//             display: "block",
//             position: "relative"
//         };
//
//         if (active) {
//             Object.assign(styles, {
//                 borderRadius: 2,
//                 boxSizing: "border-box",
//                 // boxShadow: highlight ? "inset 0px 0px 0px 2px " + color : "none",
//                 boxShadow: "inset 0px 0px 0px 2px " + activeColor,
//                 // border: "2px solid " + color,
//                 "&::after": {
//                     backgroundColor: activeColor,
//                     color: "#fff",
//                     content: '"block"',
//                     position: "absolute",
//                     top: 0,
//                     right: 0,
//                     padding: 2,
//                     fontSize: 11
//                 }
//             });
//         } else {
//             Object.assign(styles, {
//                 transition: "all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)",
//                 "&:hover": {
//                     borderRadius: 2,
//                     boxSizing: "border-box",
//                     // boxShadow: highlight ? "inset 0px 0px 0px 2px " + color : "none",
//                     boxShadow: "inset 0px 0px 0px 2px " + hoverColor
//                     // border: "2px solid " + color,
//                 },
//                 "&:hover::after": {
//                     backgroundColor: hoverColor,
//                     color: "#fff",
//                     content: '"block"',
//                     position: "absolute",
//                     top: 0,
//                     right: 0,
//                     padding: 2,
//                     fontSize: 11
//                 }
//             });
//         }
//
//         return styles;
//     });
//
//     // const StyledComponent = styled(Component)(({ highlight = true, active = true}) => {
//     //     const color = active ? "var(--mdc-theme-primary)" : "var(--mdc-theme-secondary)";
//     //
//     //     return {
//     //         /*width: "100%", // removed this because it's breaking positioning when a Row has a fixed width */
//     //         position: "relative",
//     //         flex: "100%",
//     //         padding: 0,
//     //         opacity: 1,
//     //         borderRadius: 2,
//     //         boxSizing: "border-box",
//     //         zIndex: 10,
//     //         transition: "all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)",
//     //         "&::after": {
//     //             content: "''",
//     //             position: "absolute",
//     //             zIndex: 0, // previously it was set to -1, but then background images and other elements would be displayed above
//     //             //padding: 0,
//     //             top: 0,
//     //             left: 0,
//     //             width: "calc(100% + 2px)",
//     //             height: "calc(100% + 2px)",
//     //             pointerEvents: "none",
//     //             margin: highlight ? "-2px 0 -2px -2px" : 0,
//     //             //padding: highlight ? '0 3px 3px 0px' : 0,
//     //             //boxShadow: highlight
//     //             //    ? "0px 0px 0px 1px " + color + ", inset 0px 0px 0px 1px " + color
//     //             //   : "none",
//     //             boxShadow: highlight ? "inset 0px 0px 0px 2px " + color : "none",
//     //             transition: "all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)",
//     //             opacity: highlight ? 1 : 0
//     //         },
//     //         "&::after:hover": {
//     //             opacity: 1
//     //         },
//     //         "&:hover": {
//     //             "> .innerWrapper > .type": {
//     //                 display: highlight ? "block" : "none"
//     //             }
//     //         },
//     //         "> .innerWrapper": {
//     //             width: "100%",
//     //             height: "100%", // note "auto" fixes the odd hover bug which resizes the column, but causes a bug with column vertical align
//     //             boxSizing: "border-box"
//     //         },
//     //         "> .innerWrapper > .type": {
//     //             display: highlight ? "block" : "none",
//     //             width: !active ? "100%" : "100px",
//     //             height: !active ? "100%" : "18px",
//     //             [!active ? "left" : "right"]: !active ? 0 : 0,
//     //             position: "absolute",
//     //             top: -18, //0,
//     //             zIndex: 10,
//     //             transition: "background-color 0.2s",
//     //             ".background": {
//     //                 pointerEvents: highlight ? "auto" : "none",
//     //                 display: !active ? "block" : "none",
//     //                 position: "absolute",
//     //                 width: "100%",
//     //                 height: "100%",
//     //                 cursor: "pointer",
//     //                 top: 17,
//     //                 left: 0,
//     //                 transition: "background-color 0.2s"
//     //             },
//     //             ".element-holder": {
//     //                 "> span, > svg": {
//     //                     backgroundColor: color
//     //                 }
//     //             }
//     //         }
//     //     };
//     // });
//     //
//     // return StyledComponent;
// };
//
// export const defaultStyle = {
//     opacity: 0,
//     transform: "scale(0.5)",
//     transitionProperty: "opacity, transform",
//     transitionTimingFunction: "cubic-bezier(0, 0, .2, 1)",
//     transitionDuration: "175ms",
//     transitionDelay: "50ms",
//     willChange: "opacity, transform"
// };
//
// export const transitionStyles: Record<string, any> = {
//     entering: { opacity: 0, transform: "scale(0.5)" },
//     entered: { opacity: 1, transform: "scale(1)" }
// };
