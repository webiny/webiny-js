import styled from "@emotion/styled";
import React from "react";

const Button: any = styled("a")({
    display: "flex",
    height: 35,
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
        marginRight: "10px",
        color: "var(--mdc-theme-primary)"
    },
    "&:hover": {
        textDecoration: "underline"
    }
});

const Container = styled("div")(({ maxWidth }: Props) => {
    return {
        maxWidth: maxWidth || "140px",
        width: "auto",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        "&.has-tooltip": {
            [Button]: {
                ">span": {
                    alignItems: "center",
                    justifyContent: "center",
                    display: "flex",
                    " > svg": {
                        marginRight: "10px"
                    }
                }
            }
        },
        "&.disabled": {
            pointerEvents: "none",
            cursor: "not-allowed",
            [Button]: {
                color: "var(--mdc-theme-on-background)",
                ">svg": {
                    color: "var(--mdc-theme-on-background)"
                }
            }
        }
    };
});

interface Props {
    children: React.ReactNode;
    className?: string;
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

export const ButtonLink = (props: PropsWithClick | PropsWithHref) => {
    const { children, href, target, onClick, className, ...styles } = props;
    return (
        <Container className={className} {...styles}>
            <Button href={href} target={target} onClick={onClick}>
                {children}
            </Button>
        </Container>
    );
};
