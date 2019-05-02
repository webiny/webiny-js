//@flow
import * as React from "react";
import { Transition } from "react-transition-group";
import styled from "react-emotion";
import { css } from "emotion";
import { TopAppBarSecondary, TopAppBarSection } from "webiny-ui/TopAppBar";
import { IconButton } from "webiny-ui/Button";

import { ReactComponent as CloseIcon } from "./icons/close.svg";

const OverlayLayoutWrapper = styled("div")({
    position: "fixed",
    width: "100%",
    height: "100vh",
    backgroundColor: "var(--mdc-theme-background)",
    zIndex: 5,
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

type Props = {
    barMiddle?: React.Node,
    barLeft?: React.Node,
    barRight?: React.Node,
    children: React.Node,
    onExited?: Function
};

type State = {
    isVisible: boolean
};

class OverlayLayout extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        // $FlowFixMe
        document.body.classList.add(noScroll);
    }

    static defaultProps = {
        onExited: () => {}
    };

    state = { isVisible: true };

    hideComponent = () => {
        this.setState({ isVisible: false });
        // $FlowFixMe
        document.body.classList.remove(noScroll);
    };

    componentWillUnmount() {
        // $FlowFixMe
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

export default OverlayLayout;
