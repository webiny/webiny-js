import { css } from "emotion";
import { COLORS } from "~/editor/plugins/elementSettings/components/StyledComponents";

export const breadcrumbs = css({
    display: "flex",
    zIndex: 20,
    flexDirection: "row",
    padding: 0,
    position: "fixed",
    left: 55,
    bottom: 0,
    width: "calc(100% - 55px)",
    backgroundColor: "var(--mdc-theme-surface)",
    borderTop: "1px solid var(--mdc-theme-background)",
    fontSize: "12px",
    overflow: "hidden",
    "> li": {
        cursor: "pointer",
        display: "flex",
        "& .element": {
            color: COLORS.darkestGray,
            textDecoration: "none",
            textTransform: "capitalize",
            padding: "10px 0 10px 45px",
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
            borderLeft: "30px solid hsla(300, 2%, calc(92% - var(--element-count) * 1%), 1)   ",
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
            borderLeft: "30px solid hsla(0, 0%, 100%, 1)",
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
