import React from "react";
import styled from "@emotion/styled";
import searchIcon from "./assets/search.svg";

const Container = styled("div")({
    display: "flex",
    width: "100%",
    position: "relative",
    height: "36px",
    marginBottom: "16px",
    padding: "5px 0",
    border: "1px solid var(--mdc-theme-on-background)",
    backgroundColor: "var(--mdc-theme-background)"
});

const Icon = styled("img")({
    position: "absolute",
    top: "12px",
    left: "10px",
    width: "24px",
    height: "24px"
});

const Input = styled("input")({
    display: "block",
    boxSizing: "border-box",
    border: "none",
    backgroundColor: "transparent",
    width: "100%",
    height: "100%",
    fontSize: "14px",
    lineHeight: "36px",
    paddingLeft: "45px",
    ":focus-visible": {
        outline: "none"
    }
});

interface SearchProps {
    onInput: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const Search = ({ onInput }: SearchProps) => {
    return (
        <Container>
            <Icon src={searchIcon} />
            <Input placeholder={"Search entries"} onKeyUp={onInput} />
        </Container>
    );
};
