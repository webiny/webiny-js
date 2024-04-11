import * as React from "react";
import { Logo, makeDecoratable } from "@webiny/app-admin";
import * as Styled from "./StyledComponents";
import { Elevation } from "@webiny/ui/Elevation";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";

export interface ContainerProps {
    children: React.ReactNode;
}

const Container = makeDecoratable("ViewContainer", ({ children }: ContainerProps) => (
    <Styled.Wrapper>
        <Styled.LogoWrapper>
            <Logo />
        </Styled.LogoWrapper>
        <Styled.LoginContent>{children}</Styled.LoginContent>
    </Styled.Wrapper>
));

export interface ContentProps {
    children: React.ReactNode;
}

const Content = makeDecoratable("ViewContent", ({ children }: ContentProps) => (
    <Elevation z={2}>
        <Styled.InnerContent>{children}</Styled.InnerContent>
    </Elevation>
));

export interface FooterProps {
    children: React.ReactNode;
}

const Footer = makeDecoratable("ViewFooter", ({ children }: FooterProps) => {
    return (
        <Grid>
            <Cell span={12} style={{ textAlign: "center" }}>
                {children}
            </Cell>
        </Grid>
    );
});

export interface TitleProps {
    title: string;
    description?: React.ReactNode;
}

const Title = makeDecoratable("ViewTitle", ({ title, description }: TitleProps) => {
    return (
        <Styled.Title>
            <Typography use="headline4">{title}</Typography>
            {description ? (
                <p>
                    <Typography use="body1">{description}</Typography>
                </p>
            ) : null}
        </Styled.Title>
    );
});

export const View = {
    Container,
    Logo,
    Content,
    Title,
    Footer
};
