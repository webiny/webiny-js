import React, { useRef, useEffect } from "react";
import styled from "@emotion/styled";
import { createRenderer, useRenderer, Elements } from "@webiny/app-page-builder-elements";
import { Element } from "@webiny/app-page-builder-elements/types";
import { useRecoilValue } from "recoil";
import { elementWithChildrenByIdSelector } from "~/editor/recoil/modules";
import { register } from "swiper/element/bundle";

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
        padding: 20px 0;
        max-width: 1100px;
        --swiper-navigation-color: ${props => props.theme.styles.colors.color1};
        --swiper-navigation-size: 40px;
        --swiper-pagination-color: ${props => props.theme.styles.colors.color1};
        --swiper-pagination-bottom: 0;
    }
    & .carousel-element-wrapper {
        width: 100%;
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

    // We need to increase the zIndex of PeCarousel here so we could add elements inside of carousel-element
    // Without this zIndex drag'n'drop and click to add features would not work
    const zIndex = meta.depth * 10;

    useEffect(() => {
        register();

        const swiperContainer = swiperRef?.current;
        const params = {
            rebuildOnUpdate: true
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
        pagination: bulletsToggle
    };

    return (
        <PeCarouselWrapper>
            <swiper-container ref={swiperRef} style={{ zIndex }} {...navProps}>
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
