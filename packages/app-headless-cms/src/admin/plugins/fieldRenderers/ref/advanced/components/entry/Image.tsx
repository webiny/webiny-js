import styled from "@emotion/styled";
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

const Container = styled("div")({
    width: "100%",
    backgroundColor: "var(--mdc-theme-on-background)",
    borderRight: "1px solid var(--mdc-theme-on-background)",
    borderBottom: "1px solid var(--mdc-theme-on-background)",
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain",
    backgroundOrigin: "content-box",
    backgroundPosition: "center",
    padding: 5,
    minHeight: 140,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxSizing: "border-box"
});

const Icon = styled("div")({
    flex: "0 0 100px",
    svg: {
        color: "var(--mdc-theme-text-icon-on-light)",
        width: "100%",
        height: "auto",
        maxWidth: 100,
        maxHeight: 100,
        opacity: 0.3
    }
});

interface IconProps {
    icon: string | undefined;
}

interface ImageProps {
    title: string;
    src?: string | null;
    width?: number;
    icon: string | undefined;
}

const DisplayIcon = ({ icon }: IconProps) => {
    if (!icon) {
        return null;
    }
    return <FontAwesomeIcon icon={(icon || "").split("/") as IconProp} />;
};

export const Image = ({ src, icon, width = 166 }: ImageProps) => {
    if (!src) {
        return (
            <Container>
                <Icon>
                    <DisplayIcon icon={icon} />
                </Icon>
            </Container>
        );
    }
    return <Container style={{ backgroundImage: "url(" + src + "?width=" + width + ")" }} />;
};
