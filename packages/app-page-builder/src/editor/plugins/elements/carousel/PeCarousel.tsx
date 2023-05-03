import React, { useRef, useEffect } from "react";
import styled from "@emotion/styled";
import { createRenderer, useRenderer, Elements } from "@webiny/app-page-builder-elements";
import { Element } from "@webiny/app-page-builder-elements/types";
import { useRecoilValue } from "recoil";
import { elementWithChildrenByIdSelector } from "~/editor/recoil/modules";
import { register } from "swiper/element/bundle";

register();

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "swiper-container": { [key: string]: any };
            "swiper-slide": { [key: string]: any };
        }
    }
}

const PeCarouselWrapper = styled.div`
    display: flex;
    justify-content: center;
    & swiper-slide {
        text-align: center;
        font-size: 16px;
        background: #fff;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    & swiper-container {
        max-width: 1100px;
    }
    & .carousel-element-wrapper {
        max-width: calc(95% - 41px);
    }
`;

const PeCarousel = createRenderer(() => {
    const swiperRef = useRef<any>(null);
    const { getElement, meta } = useRenderer();
    const element = getElement();
    const elementWithChildren = useRecoilValue(
        elementWithChildrenByIdSelector(element.id)
    ) as Element;
    const childrenElements = elementWithChildren?.elements;

    const { arrowsToggle = true, bulletsToggle = true } = element?.data?.settings?.carousel;

    const zIndex = meta.depth * 10;

    useEffect(() => {
        const swiperContainer = swiperRef?.current;
        const params = {
            rebuildOnUpdate: true,
            injectStyles: [
                `
                    .swiper-button-next,
                    .swiper-button-prev {
                        width: 40px;
                        color: var(--mdc-theme-primary);
                    }
                    .swiper-pagination-bullet {
                        background-color: var(--mdc-theme-primary)
                    }
                `
            ]
        };
        Object.assign(swiperContainer, params);
        swiperContainer.initialize();
    }, []);

    useEffect(() => {
        const swiperContainer = swiperRef?.current;
        // By default swiper does not know that it has to rerender whenever we add a new slide
        // So we have to update it manually whenever childrenElements.lenght is changing
        // To do that we use swiper.update()
        if (swiperContainer?.swiper?.update) {
            swiperContainer.swiper.update();
        }
    }, [childrenElements.length]);

    // This is a workaround that solves an issue with hiding and showing slider navigation controller
    // Without this workaround swiper cannot show and hide navigation arrows properly
    // Demo: https://codesandbox.io/p/sandbox/swiper-react-navigation-forked-v9ue2y?file=%2Fsrc%2FApp.jsx&selection=%5B%7B%22endColumn%22%3A26%2C%22endLineNumber%22%3A57%2C%22startColumn%22%3A26%2C%22startLineNumber%22%3A57%7D%5D
    useEffect(() => {
        const swiperContainer = swiperRef?.current;

        if (!arrowsToggle) {
            // swiperContainer?.swiper?.navigation?.destroy() only removes event listeners from navigation
            // and adds a disable class to navigation buttons, so we need to hide them manually
            // and when the toggle is on we need to remove manually added styles (like in second condition)
            swiperContainer?.swiper?.navigation?.destroy();
            if (
                swiperContainer?.swiper?.navigation?.nextEl &&
                swiperContainer?.swiper?.navigation?.prevEl
            ) {
                swiperContainer.swiper.navigation.nextEl.setAttribute("style", "display: none");
                swiperContainer.swiper.navigation.prevEl.setAttribute("style", "display: none");
            }
        }

        if (arrowsToggle) {
            swiperContainer?.swiper?.navigation?.init();
            swiperContainer?.swiper?.navigation?.update();
            if (
                swiperContainer?.swiper?.navigation?.nextEl &&
                swiperContainer?.swiper?.navigation?.prevEl
            ) {
                swiperContainer.swiper.navigation.nextEl.removeAttribute("style", "display: none");
                swiperContainer.swiper.navigation.prevEl.removeAttribute("style", "display: none");
            }
        }
    }, [arrowsToggle]);

    // Here we solve the same issue as abbove, basically swiper can show bullets if they were hidden
    // but when we want to hide them again it would not work, the value of bulletsToggle would be false
    // but the swiper would not reflect that value
    useEffect(() => {
        const swiperContainer = swiperRef?.current;

        if (!bulletsToggle) {
            swiperContainer?.swiper?.pagination?.destroy();
            if (swiperContainer?.swiper?.pagination?.el) {
                swiperContainer.swiper.pagination.el.setAttribute("style", "display: none");
            }
        }

        if (bulletsToggle) {
            swiperContainer?.swiper?.pagination?.init();
            swiperContainer?.swiper?.pagination?.update();
            if (swiperContainer?.swiper?.pagination?.el) {
                swiperContainer.swiper.pagination.el.removeAttribute("style", "display: none");
            }
        }
    }, [bulletsToggle]);

    return (
        <PeCarouselWrapper>
            <swiper-container
                ref={swiperRef}
                style={{ zIndex }}
                init="false"
                navigation={arrowsToggle}
                pagination={bulletsToggle}
                pagination-clickable={true}
            >
                {childrenElements.map((carousel, index) => {
                    return (
                        <swiper-slide key={index}>
                            <div className="carousel-element-wrapper">
                                <Elements
                                    element={{ ...elementWithChildren, elements: [carousel] }}
                                />
                            </div>
                        </swiper-slide>
                    );
                })}
            </swiper-container>
        </PeCarouselWrapper>
    );
});

export default PeCarousel;
