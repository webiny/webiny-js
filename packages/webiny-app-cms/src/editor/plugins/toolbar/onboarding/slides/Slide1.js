//@flow
import React from "react";
import styled from "react-emotion";
import { css } from "emotion";
import { ReactComponent as LogoIcon } from "../assets/logo.svg";
import { ReactComponent as EditorMockIcon } from "../assets/editor-mock.svg";
import { Typography } from "webiny-ui/Typography";
import { ButtonPrimary } from "webiny-ui/Button";

const SlideContainer = styled("div")({
    display: "flex",
    flexDirection: "column",
    width: 800,
    height: 600,
    alignItems: "center",
    justifyContent: "flex-start"
});

const Logo = styled("div")({
    width: "100%",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 20
});

const EditorMock = styled("div")({
    width: "100%",
    textAlign: "center",
    ">svg": {
        width: 650,
        height: "100%"
    }
});

const Text = styled("div")({
    paddingTop: 20,
    paddingBottom: 20,
    width: "60%",
    textAlign: "center",
    margin: "0 auto",
    h4: {
        paddingBottom: 20
    }
});

const getStartedStyle = css({
    marginTop: 20
});

type Props = {
    nextSlide: Function
};

const Slide1 = (props: Props) => {
    return (
        <SlideContainer>
            <Logo>
                <LogoIcon />
            </Logo>
            <EditorMock>
                <EditorMockIcon />
            </EditorMock>
            <Text>
                <h4>
                    <Typography use={"headline4"}>Welcome to Webiny Page Editor</Typography>
                </h4>
                <p>
                    <Typography use={"body2"}>
                        Let’s go through some basics, and learn how to use the page editor, create
                        content, and adapt it so it fit’s your visual style.
                    </Typography>
                </p>
            </Text>
            <ButtonPrimary onClick={props.nextSlide} className={getStartedStyle}>
                Get Started
            </ButtonPrimary>
        </SlideContainer>
    );
};

export default Slide1;
