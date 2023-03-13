import React from "react";
import styled from "@emotion/styled";

const Container = styled("div")({
    display: "flex",
    flexDirection: "row",
    minWidth: "140px"
});

const Icon = styled("div")({
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
});
const Content = styled("div")({
    flex: "1",
    paddingLeft: "10px"
});
const Name = styled("h4")({
    fontWeight: 500,
    fontSize: 11,
    lineHeight: "16px",
    letterSpacing: "0.5px",
    color: "#938F99",
    textTransform: "uppercase"
});
const Text = styled("h5")({
    fontWeight: 500,
    fontSize: 11,
    lineHeight: "16px",
    letterSpacing: "0.5px",
    color: "#49454F"
});

interface Props {
    icon: React.ReactElement | null;
    name: string;
    children?: React.ReactNode;
}

export const Box: React.VFC<Props> = ({ icon, name, children }) => {
    if (!children) {
        return <Container />;
    }
    return (
        <Container>
            <Icon>{icon}</Icon>
            <Content>
                <Name>{name}</Name>
                <Text>{children}</Text>
            </Content>
        </Container>
    );
};
