import React from "react";
import styled from "@emotion/styled";
import { ReactComponent as SearchIcon } from "./assets/search.svg";

const Container = styled("div")({
    display: "flex",
    width: "100%",
    position: "relative",
    height: "36px",
    marginBottom: "16px"
});

const Icon = styled(SearchIcon)({
    position: "absolute",
    top: "6px",
    left: "16px",
    width: "24px",
    height: "24px"
});

const Input = styled("input")({
    display: "block",
    boxSizing: "border-box",
    border: "1px solid var(--mdc-theme-on-background)",
    backgroundColor: "var(--mdc-theme-background)",
    width: "100%",
    height: "100%",
    fontSize: "14px",
    lineHeight: "36px",
    paddingLeft: "46px",
    ":focus-visible": {
        outline: "none"
    }
});

interface Props {
    onInput: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const Search: React.VFC<Props> = ({ onInput }) => {
    return (
        <Container>
            <Icon />
            <Input placeholder={"Search entries"} onKeyUp={onInput} />
        </Container>
    );
};
