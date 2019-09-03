//@flow
import React, { useCallback, useEffect, useState } from "react";
import styled from "react-emotion";
import { Carousel } from "@webiny/ui/Carousel";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { deactivatePlugin } from "@webiny/app-page-builder/editor/actions";
import { isPluginActive } from "@webiny/app-page-builder/editor/selectors";
import { useKeyHandler } from "@webiny/app-page-builder/editor/hooks/useKeyHandler";

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

const Onboarding = React.memo(({ deactivatePlugin, showOnboarding }) => {
    const [slideIndex, setSlideIndex] = useState(0);
    const { addKeyHandler, removeKeyHandler } = useKeyHandler();

    const nextSlide = useCallback(() => {
        setSlideIndex(slideIndex + 1);
    }, [slideIndex]);

    const closeDialog = useCallback(() => {
        setSlideIndex(0);
        deactivatePlugin({ name: "pb-editor-toolbar-onboarding" });
    }, [setSlideIndex]);

    useEffect(() => {
        showOnboarding ? addKeyHandler("escape", closeDialog) : removeKeyHandler("escape");
    });

    if (!showOnboarding) {
        return null;
    }

    return (
        <Overlay>
            <Container>
                <Carousel
                    speed={slideIndex < 1 || slideIndex > 4 ? 500 : 0}
                    dragging={true}
                    transitionMode={"scroll"}
                    slideIndex={slideIndex}
                    afterSlide={setSlideIndex}
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
                        <Slide1 nextSlide={nextSlide} />
                    </InnerContainer>
                    <InnerContainer>
                        <Slide2 currentSlide={slideIndex + 1} />
                    </InnerContainer>
                    <InnerContainer>
                        <Slide3 currentSlide={slideIndex + 1} />
                    </InnerContainer>
                    <InnerContainer>
                        <Slide4 currentSlide={slideIndex + 1} />
                    </InnerContainer>
                    <InnerContainer>
                        <Slide5 currentSlide={slideIndex + 1} />
                    </InnerContainer>
                    <InnerContainer>
                        <Slide6 currentSlide={slideIndex + 1} />
                    </InnerContainer>
                    <InnerContainer>
                        <Slide7 closeDialog={closeDialog} />
                    </InnerContainer>
                </Carousel>
            </Container>
        </Overlay>
    );
});

export default connect(
    state => ({
        showOnboarding: isPluginActive("pb-editor-toolbar-onboarding")(state)
    }),
    { deactivatePlugin }
)(Onboarding);
