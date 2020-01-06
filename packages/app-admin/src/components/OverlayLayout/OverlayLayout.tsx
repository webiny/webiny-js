import * as React from "react";
import { Transition } from "react-transition-group";
import styled from "@emotion/styled";
import { css } from "emotion";
import { TopAppBarSecondary, TopAppBarSection } from "@webiny/ui/TopAppBar";
import { IconButton } from "@webiny/ui/Button";

import { ReactComponent as CloseIcon } from "./icons/close.svg";

const OverlayLayoutWrapper = styled("div")({
    position: "fixed",
    width: "100%",
    height: "100vh",
    backgroundColor: "var(--mdc-theme-background)",
    zIndex: 9, // has to be higher than 5 so it's above advanced settings dialog, and below 10, so the image editor can be displayed above
    paddingTop: 65,
    top: 0,
    left: 0
});

const noScroll = css({
    overflow: "hidden",
    height: "100vh"
});

const defaultStyle = {
    transform: "translateY(75vh)",
    opacity: 0,
    transitionProperty: "transform, opacity",
    transitionTimingFunction: "cubic-bezier(0, 0, .2, 1)",
    transitionDuration: "225ms",
    willChange: "opacity, transform"
};

const transitionStyles = {
    entering: { transform: "translateY(75vh)", opacity: 0 },
    entered: { transform: "translateY(0px)", opacity: 1 }
};

type OverlayLayoutProps = {
    barMiddle?: React.ReactNode;
    barLeft?: React.ReactNode;
    barRight?: React.ReactNode;
    children: React.ReactNode;
    onExited?: Function;
    style?: React.CSSProperties;
};

type State = {
    isVisible: boolean;
};

export class OverlayLayout extends React.Component<OverlayLayoutProps, State> {
    constructor(props) {
        super(props);
        document.body.classList.add(noScroll);
    }

    static defaultProps = {
        onExited: () => {}
    };

    state = { isVisible: true };

    hideComponent = () => {
        this.setState({ isVisible: false });
        document.body.classList.remove(noScroll);
    };

    componentWillUnmount() {
        document.body.classList.remove(noScroll);
    }

    render() {
        const { onExited, barLeft, barMiddle, barRight, children, style, ...rest } = this.props;

        return (
            <Transition in={this.state.isVisible} timeout={100} appear onExited={onExited}>
                {state => (
                    <OverlayLayoutWrapper
                        {...rest}
                        style={{ ...defaultStyle, ...style, ...transitionStyles[state] }}
                    >
                        <TopAppBarSecondary fixed style={{ top: 0 }}>
                            <TopAppBarSection style={{ width: "33%" }} alignStart>
                                {barLeft}
                            </TopAppBarSection>
                            <TopAppBarSection style={{ width: "33%" }}>
                                {barMiddle}
                            </TopAppBarSection>
                            <TopAppBarSection style={{ width: "33%" }} alignEnd>
                                {barRight}
                                <IconButton
                                    ripple={false}
                                    onClick={this.hideComponent}
                                    icon={<CloseIcon style={{ width: 24, height: 24 }} />}
                                />
                            </TopAppBarSection>
                        </TopAppBarSecondary>

                        {children}
                    </OverlayLayoutWrapper>
                )}
            </Transition>
        );
    }
}
