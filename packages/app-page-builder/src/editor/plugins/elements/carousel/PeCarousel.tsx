import React, { useRef, useEffect } from "react";
import styled from "@emotion/styled";
import { useRecoilValue } from "recoil";
import { elementWithChildrenByIdSelector } from "~/editor/recoil/modules";

import { DynamicElementWrapper } from "~/editor/components/DynamicElementWrapper";
import { createRenderer, useRenderer, Elements } from "@webiny/app-page-builder-elements";
import { useIsDynamicElement } from "@webiny/app-dynamic-pages/hooks/useIsDynamicElement";
import { Element } from "@webiny/app-page-builder-elements/types";

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

    & swiper-slide:only-of-type {
        width: 1100px;
    }

    & swiper-container {
        max-width: 1100px;
        --swiper-pagination-bottom: 0;
    }

    & .carousel-element-wrapper {
        max-width: calc(95% - 30px);
    }
`;

const PeCarousel = createRenderer(() => {
    const swiperRef = useRef<any>(null);
    const { getElement, meta } = useRenderer();
    const element = getElement();
    const isDynamic = useIsDynamicElement(element);
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

    const navProps = {
        navigation: arrowsToggle,
        pagination: bulletsToggle,
        "allow-slide-next": isDynamic ? false : true,
        "allow-slide-prev": isDynamic ? false : true
    };

    return (
        <PeCarouselWrapper>
            <swiper-container ref={swiperRef} style={{ zIndex }} init="false" {...navProps}>
                <DynamicElementWrapper element={element}>
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
                </DynamicElementWrapper>
            </swiper-container>
        </PeCarouselWrapper>
    );
});

export default PeCarousel;
