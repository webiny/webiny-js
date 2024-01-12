import styled from "@emotion/styled";
import React from "react";
import { IconPicker } from "@webiny/app-admin/components/IconPicker";
import { Icon as IconType } from "@webiny/app-admin/components/IconPicker/types";

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
    flex: "0 0 100px"
});

interface ImageProps {
    title: string;
    src?: string | null;
    width?: number;
    icon?: IconType;
}

export const Image = ({ src, icon, width = 166 }: ImageProps) => {
    if (!src) {
        return (
            <Container>
                <Icon>
                    <IconPicker.Icon icon={icon} size={100} />
                </Icon>
            </Container>
        );
    }
    return <Container style={{ backgroundImage: "url(" + src + "?width=" + width + ")" }} />;
};
