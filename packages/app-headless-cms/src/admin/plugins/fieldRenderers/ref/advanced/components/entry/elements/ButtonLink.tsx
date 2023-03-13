import styled from "@emotion/styled";
import React from "react";

const Container = styled("div")(({ maxWidth }: Props) => {
    return {
        maxWidth: maxWidth || "140px",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        // marginLeft: "auto",
        marginRight: "auto"
    };
});

const Button = styled("a")({
    display: "flex",
    width: "auto",
    fontWeight: 500,
    fontSize: "14px",
    lineHeight: "20px",
    letterSpacing: "0.1px",
    textTransform: "uppercase",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "var(--mdc-theme-primary)",
    " > svg": {
        marginRight: "10px"
    }
});

interface Props {
    children: React.ReactNode;
    maxWidth?: `${string}px`;
}

interface PropsWithClick extends Props {
    href?: never;
    target?: never;
    onClick: (ev: React.MouseEvent) => void;
}

interface PropsWithHref extends Props {
    href: string;
    target: "_blank" | string;
    onClick?: never;
}

export const ButtonLink: React.VFC<PropsWithClick | PropsWithHref> = props => {
    const { children, href, target, onClick, ...styles } = props;
    return (
        <Container {...styles}>
            <Button href={href} target={target} onClick={onClick}>
                {children}
            </Button>
        </Container>
    );
};
