import * as React from "react";
import styled from "@emotion/styled";
import { css } from "emotion";
import { Typography } from "@webiny/ui/Typography";
import { Elevation } from "@webiny/ui/Elevation";

const SectionWrapper = styled("div")({
    backgroundColor: "var(--mdc-theme-background)",
    padding: "0 0 25px 0"
});

const titleStyle = css({
    display: "flex",
    alignItems: "center",
    color: "var(--mdc-theme-on-surface)",
    ".tooltip-content-wrapper": {
        lineHeight: "100%",
        svg: {
            height: 13,
            color: "var(--mdc-theme-on-surface)"
        }
    }
});

const ElevationContent = styled("div")({
    padding: 20,
    backgroundColor: "#fff"
});

const Section = ({ children, title, ...props }) => {
    return (
        <SectionWrapper {...props}>
            <h4>
                <Typography className={titleStyle} use={"overline"}>
                    {title}
                </Typography>
            </h4>

            <Elevation z={2}>
                <ElevationContent>{children}</ElevationContent>
            </Elevation>
        </SectionWrapper>
    );
};

export default Section;
