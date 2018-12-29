//@flow
import styled from "react-emotion";
import { css } from "emotion";
import { pure } from "recompose";

export const typeStyle = css({
    position: "relative",
    cursor: "pointer",
    ".element-holder": {
        position: "absolute",
        cursor: "pointer",
        display: "flex",
        top: -22,
        boxSizing: "border-box",
        right: -2,
        fontSize: 10,
        padding: 0,
        color: "#fff",
        zIndex: 30,
        width: "auto",
        "> span": {
            borderRadius: 2,
            display: "flex",
            padding: "4px 10px",
            "> svg": {
                height: 13,
                width: 13,
                marginRight: 5
            }
        },
        "> svg": {
            borderRadius: 2,
            height: 13,
            padding: 4,
            marginRight: 5,
            "&.help-icon": {
                cursor: "pointer"
            }
        }
    }
});

export const ElementContainer = pure(
    styled("div")(({ highlight, active, dragged }) => {
        const color = active ? "var(--mdc-theme-primary)" : "var(--mdc-theme-secondary)";

        return {
            position: "relative",
            flex: "100%",
            padding: 0,
            opacity: dragged ? 0.3 : 1,
            borderRadius: 2,
            boxSizing: "border-box",
            transition: "all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)",
            "&.no-highlight": {
                "::after": {
                    content: "none"
                }
            },
            "&::after": {
                content: "''",
                position: "absolute",
                zIndex: -1,
                padding: 2,
                top: -2,
                left: -2,
                width: "100%",
                height: "100%",
                boxShadow: highlight ? "inset 0px 0px 0px 2px " + color : "none",
                transition: "all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)",
                opacity: highlight ? 1 : 0
            },
            "&:hover::after": {
                opacity: 1
            },
            "&:hover": {
                "> .innerWrapper > .type": {
                    display: highlight ? "block" : "none"
                }
            },
            "> .innerWrapper": {
                width: "100%",
                height: "100%", // note "auto" fixes the odd hover bug which resizes the column, but causes a bug with column vertical align
                boxSizing: "border-box"
            },
            "> .innerWrapper > .type": {
                display: highlight ? "block" : "none",
                width: !active ? "100%" : "100px",
                height: !active ? "100%" : "25px",
                [!active ? "left" : "right"]: 0,
                position: "absolute",
                top: 0,
                zIndex: 10,
                transition: "background-color 0.2s",
                ".background": {
                    pointerEvents: highlight ? "auto" : "none",
                    display: !active ? "block" : "none",
                    position: "absolute",
                    backgroundColor: active ? "rgba(250, 87, 35, 1)" : "rgba(0, 204, 176, 0.1)",
                    width: "100%",
                    height: "100%",
                    cursor: "pointer",
                    top: 0,
                    left: 0,
                    transition: "background-color 0.2s"
                },
                ".element-holder": {
                    "> span, > svg": {
                        backgroundColor: color
                    }
                }
            }
        };
    })
);

export const defaultStyle = {
    opacity: 0,
    transform: "scale(0.5)",
    transitionProperty: "opacity, transform",
    transitionTimingFunction: "cubic-bezier(0, 0, .2, 1)",
    transitionDuration: "175ms",
    transitionDelay: "50ms",
    willChange: "opacity, transform"
};

export const transitionStyles = {
    entering: { opacity: 0, transform: "scale(0.5)" },
    entered: { opacity: 1, transform: "scale(1)" }
};
