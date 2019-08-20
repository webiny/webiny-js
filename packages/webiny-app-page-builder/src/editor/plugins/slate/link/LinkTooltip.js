import React from "react";
import styled from "react-emotion";
import { css } from "emotion";
import { Elevation } from "webiny-ui/Elevation";
import useLink from "./useLink";

const Tooltip = styled("span")({
    display: "flex",
    flexDirection: "row",
    position: "fixed",
    top: 20,
    left: 0,
    zIndex: 1,
    width: "auto",
    maxWidth: 520,
    "> span:not(:first-child)": {
        marginLeft: 10
    }
});

const tooltipInner = css({
    padding: "5px 10px",
    borderRadius: 2,
    fontSize: "0.8rem",
    a: {
        cursor: "pointer"
    }
});

const compressLink = href => {
    const start = href.substr(0, 24);
    const end = href.substr(24).substr(-24);

    return [start, "...", end].join("");
};

const displayNone = { display: "none" };

const LinkTooltip = props => {
    const { menuRef, href, activateLink, removeLink } = useLink(props);

    return (
        <Tooltip innerRef={menuRef} style={displayNone}>
            <Elevation className={tooltipInner} z={1}>
                <span>
                    Link:{" "}
                    <a href={href} target={"_blank"}>
                        {href.length > 50 ? compressLink(href) : href}
                    </a>
                </span>{" "}
                | <a onClick={activateLink}>Change</a> | <a onClick={removeLink}>Remove</a>
            </Elevation>
        </Tooltip>
    );
};

export default LinkTooltip;
