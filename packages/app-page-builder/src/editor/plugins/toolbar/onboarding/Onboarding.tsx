import React, { useCallback, useEffect, useState } from "react";
import styled from "@emotion/styled";
import { Carousel } from "@webiny/ui/Carousel";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { isPluginActiveSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { DeactivatePluginActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { useKeyHandler } from "@webiny/app-page-builder/editor/hooks/useKeyHandler";
import { useRecoilValue } from "recoil";

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

const OutsideContainer = styled("div")({
    width: "100%",
    height: "100%",
    position: "absolute"
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

const onboardingPluginName = "pb-editor-toolbar-onboarding";

const Onboarding: React.FunctionComponent = () => {
    const handler = useEventActionHandler();
    const [slideIndex, setSlideIndex] = useState(0);
    const { addKeyHandler, removeKeyHandler } = useKeyHandler();
    const showOnboarding = useRecoilValue(isPluginActiveSelector(onboardingPluginName));

    const nextSlide = useCallback(() => {
        setSlideIndex(slideIndex + 1);
    }, [slideIndex]);

    const closeDialog = useCallback(() => {
        setSlideIndex(0);
        handler.trigger(
            new DeactivatePluginActionEvent({
                name: onboardingPluginName
            })
        );
    }, [setSlideIndex]);

    useEffect(() => {
        showOnboarding ? addKeyHandler("escape", closeDialog) : removeKeyHandler("escape");
    });

    if (!showOnboarding) {
        return null;
    }

    return (
        <Overlay>
            <OutsideContainer onClick={closeDialog} />
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
};

export default React.memo(Onboarding);
