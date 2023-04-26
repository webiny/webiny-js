import React, { useCallback } from "react";
import styled from "@emotion/styled";
import { ReactComponent as BackIcon } from "@material-design-icons/svg/round/arrow_back.svg";
import { ButtonDefault } from "@webiny/ui/Button";

const Wrapper = styled("div")({
    display: "flex",
    alignItems: "center",
    background: "var(--mdc-theme-surface)",
    "border-bottom": "1px solid var(--mdc-theme-on-background)",
    padding: "8px 0 8px 12px",
    boxSizing: "border-box",
    height: "65px",
    " svg": {
        marginRight: "12px"
    },
    " > button": {
        fontSize: "20px",
        lineHeight: "48px",
        letterSpacing: "inherit",
        textTransform: "none",
        color: "black !important"
    }
});

export const Header: React.VFC = () => {
    const onClick = useCallback(() => {
        history.back();
    }, [history]);
    return (
        <Wrapper>
            <ButtonDefault onClick={onClick}>
                <BackIcon /> Go Back
            </ButtonDefault>
        </Wrapper>
    );
};
