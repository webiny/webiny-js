//@flow
import React from "react";
import styled from "react-emotion";
import { Carousel } from "webiny-ui/Carousel";
import { connect } from "react-redux";
import { compose } from "recompose";
import { deactivatePlugin } from "webiny-app-cms/editor/actions";
import { getActivePlugin } from "webiny-app-cms/editor/selectors";
import { withKeyHandler } from "webiny-app-cms/editor/components";

import { ReactComponent as NextSlideIcon } from "./assets/next-slide.svg";
import { ReactComponent as PrevSlideIcon } from "./assets/prev-slide.svg";

import Slide1 from "./slides/Slide1";
import Slide2 from "./slides/Slide2";
import Slide3 from "./slides/Slide3";
import Slide4 from "./slides/Slide4";
import Slide5 from "./slides/Slide5";
import Slide6 from "./slides/Slide6";
import Slide7 from "./slides/Slide7";

const Overlay = styled("div")({
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ".slider-control-centerright": {
        right: "-50px !important"
    },
    ".slider-control-centerleft": {
        left: "-50px !important"
    },
    ".slider-control-bottomcenter": {
        bottom: "-50px !important"
    }
});

const Container = styled("div")({
    width: 800,
    height: 600,
    backgroundColor: "var(--mdc-theme-surface)",
    borderRadius: 2,
    color: "var(--mdc-theme-text-primary-on-background)"
});

const InnerContainer = styled("div")({
    width: "100%",
    height: "100%",
    display: "flex"
});

const SlideControl = styled("div")({
    background: "var(--mdc-theme-surface)",
    boxShadow: "0 6px 6px 0 rgba(0,0,0,0.26), 0 10px 20px 0 rgba(0,0,0,0.19)",
    borderRadius: "50%",
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "var(--mdc-theme-text-secondary-on-background)",
    "&:hover": {
        background: "var(--mdc-theme-background)"
    }
});

type Props = {
    showOnboarding: boolean,
    deactivatePlugin: Function
};

type State = {
    slideIndex: number
};

class Onboarding extends React.Component<Props, State> {
    state = {
        slideIndex: 0
    };

    nextSlide = () => {
        this.setState({ slideIndex: this.state.slideIndex + 1 });
    };

    closeDialog = () => {
        this.setState({ slideIndex: 0 });
        this.props.deactivatePlugin({ name: "toolbar-onboarding" });
    };

    render() {
        const { showOnboarding } = this.props;
        if (!showOnboarding) {
            return null;
        }

        return (
            <Overlay>
                <Container>
                    <Carousel
                        speed={this.state.slideIndex < 1 || this.state.slideIndex > 4 ? 500 : 0}
                        dragging={true}
                        transitionMode={"scroll"}
                        slideIndex={this.state.slideIndex}
                        afterSlide={slideIndex => this.setState({ slideIndex })}
                        renderNextSlide={({ nextSlide, currentSlide }) =>
                            currentSlide < 6 && (
                                <SlideControl onClick={nextSlide}>
                                    <NextSlideIcon />
                                </SlideControl>
                            )
                        }
                        renderPreviousSlide={({ previousSlide, currentSlide }) =>
                            currentSlide > 0 && (
                                <SlideControl onClick={previousSlide}>
                                    <PrevSlideIcon />
                                </SlideControl>
                            )
                        }
                    >
                        <InnerContainer>
                            <Slide1 nextSlide={this.nextSlide} />
                        </InnerContainer>
                        <InnerContainer>
                            <Slide2 currentSlide={this.state.slideIndex + 1} />
                        </InnerContainer>
                        <InnerContainer>
                            <Slide3 currentSlide={this.state.slideIndex + 1} />
                        </InnerContainer>
                        <InnerContainer>
                            <Slide4 currentSlide={this.state.slideIndex + 1} />
                        </InnerContainer>
                        <InnerContainer>
                            <Slide5 currentSlide={this.state.slideIndex + 1} />
                        </InnerContainer>
                        <InnerContainer>
                            <Slide6 currentSlide={this.state.slideIndex + 1} />
                        </InnerContainer>
                        <InnerContainer>
                            <Slide7 closeDialog={this.closeDialog} />
                        </InnerContainer>
                    </Carousel>
                </Container>
            </Overlay>
        );
    }
}

export default compose(
    withKeyHandler(),
    connect(
        state => ({
            showOnboarding: getActivePlugin("cms-toolbar-bottom")(state) === "toolbar-onboarding"
        }),
        { deactivatePlugin }
    )
)(Onboarding);
