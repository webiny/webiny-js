//@flow
import React from "react";
import styled from "@emotion/styled";
import { css } from "emotion";
import { ReactComponent as LogoIcon } from "../assets/logo.svg";
import { ReactComponent as AddFabBg } from "../assets/slide-7-fab-bg.svg";
import { Typography } from "@webiny/ui/Typography";
import { ButtonPrimary } from "@webiny/ui/Button";

const SlideContainer = styled("div")({
    display: "flex",
    flexDirection: "column",
    width: 800,
    height: 600,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 100,
    boxSizing: "border-box"
});

const Logo = styled("div")({
    width: "100%",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 20
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

const Footer = styled("div")({
    width: "100%",
    padding: 25,
    boxSizing: "border-box",
    backgroundColor: "var(--mdc-theme-background)",
    color: "var(--mdc-theme-text-primary-on-background)",
    position: "absolute",
    bottom: 0,
    textAlign: "center"
});

const getStartedStyle = css({
    marginTop: 20
});

const addFabStyle = css({
    position: "absolute",
    zIndex: -1,
    right: -100,
    bottom: -80
});

type Props = {
    closeDialog: Function
};

const Slide7 = (props: Props) => {
    return (
        <SlideContainer>
            <Logo>
                <LogoIcon />
            </Logo>
            <Text>
                <h4>
                    <Typography use={"headline4"}>Ready to Start Building?</Typography>
                </h4>
                <p>
                    <Typography use={"body2"}>
                        Close this dialog, and then click the big green button in the corner to add
                        your first block.
                    </Typography>
                </p>
            </Text>
            <ButtonPrimary onClick={props.closeDialog} className={getStartedStyle}>
                {"I'm Ready"}
            </ButtonPrimary>
            <Footer>
                <Typography use={"body1"}>
                    To visit this guide again, just click the help icon in the left toolbar.
                </Typography>
            </Footer>
            <AddFabBg className={addFabStyle} />
        </SlideContainer>
    );
};

export default Slide7;
