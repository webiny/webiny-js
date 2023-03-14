import styled from "@emotion/styled";
import React from "react";

const Container = styled("div")({
    width: "100%",
    backgroundColor: "var(--mdc-theme-on-background)",
    borderRight: "1px solid var(--mdc-theme-on-background)",
    borderBottom: "1px solid var(--mdc-theme-on-background)",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    minHeight: 140
});

interface Props {
    title: string;
    src?: string | null;
    width?: number;
}
export const Image: React.VFC<Props> = ({ src, width = 166 }) => {
    if (!src) {
        return <Container />;
    }
    return <Container style={{ backgroundImage: "url(" + src + "?width=" + width + ")" }} />;
};
