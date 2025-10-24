import { css } from "emotion";

export const breadcrumbs = css({
    display: "flex",
    zIndex: 100,
    flexDirection: "row",
    padding: 0,
    position: "absolute",
    left: 300,
    bottom: 0,
    width: "calc(100% - 600px)",
    height: "31px",
    backgroundColor: "var(--color-neutral-base)",
    borderTop: "1px solid var( --color-neutral-dimmed)",
    fontSize: "12px",
    overflow: "hidden",
    "> li": {
        cursor: "pointer",
        display: "flex",
        "& .element": {
            color: "var(--text-neutral-strong)",
            textDecoration: "none",
            textTransform: "capitalize",
            padding: "5px 0 5px 30px",
            background: "hsla(300, 2%, calc(92% - var(--element-count) * 1%), 1)",
            position: "relative",
            display: "block"
        },
        "& .element::after": {
            content: '" "',
            display: "block",
            width: "0",
            height: "0",
            borderTop: "50px solid transparent",
            borderBottom: "50px solid transparent",
            borderLeft: "20px solid hsla(300, 2%, calc(92% - var(--element-count) * 1%), 1)   ",
            position: "absolute",
            top: "50%",
            marginTop: "-50px",
            left: "100%",
            zIndex: 2
        },
        "& .element::before": {
            content: '" "',
            display: "block",
            width: "0",
            height: "0",
            borderTop: "50px solid transparent",
            borderBottom: "50px solid transparent",
            borderLeft: "20px solid hsla(0, 0%, 100%, 1)",
            position: "absolute",
            top: "50%",
            marginTop: "-50px",
            marginLeft: "1px",
            left: "100%",
            zIndex: 1
        }
    },
    "& li:first-child .element": { paddingLeft: "10px" },

    // Handle active state
    "& li .element:hover": {
        color: "var(--mdc-theme-surface)",
        background: "var(--mdc-theme-secondary)"
    },
    "& li .element:hover:after": {
        color: "var(--mdc-theme-surface)",
        borderLeftColor: "var(--mdc-theme-secondary) !important"
    }
});
