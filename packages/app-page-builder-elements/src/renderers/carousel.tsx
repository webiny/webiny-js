import React from "react";
import styled from "@emotion/styled";
import { Elements } from "~/components/Elements";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";
import { usePageElements } from "~/hooks/usePageElements";
import { registerCarousel } from "~/modifiers/carousel/index";

export type CarouselRenderer = ReturnType<typeof createCarousel>;

const CarouselWrapper = styled.div`
    display: flex;
    justify-content: center;
    --swiper-navigation-color: var(--mdc-theme-primary);
    --swiper-pagination-color: var(--mdc-theme-primary);
    & swiper-slide {
        text-align: center;
        font-size: 18px;
        background: #fff;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    & .carousel-element-wrapper {
        max-width: calc(95% - 41px);
    }
`;

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "swiper-container": { [key: string]: any };
            "swiper-slide": { [key: string]: any };
        }
    }
}
export const createCarousel = () => {
    registerCarousel();
    return createRenderer(() => {
        const { getElement } = useRenderer();
        const { theme } = usePageElements();
        const element = getElement();

        const { arrowsToggle = true, bulletsToggle = true } = element?.data?.settings?.carousel;

        const paginationClickable = bulletsToggle ? true : null;

        theme.styles.elements["carousel"] = {
            "swiper-container": {
                "--swiper-navigation-color": `${theme.styles.colors.color1}`,
                "--swiper-pagination-color": `${theme.styles.colors.color1}`,
                maxWidth: "1100px"
            }
        };

        return (
            <CarouselWrapper>
                <swiper-container
                    class="carousel-preview"
                    navigation={arrowsToggle}
                    pagination={bulletsToggle}
                    pagination-clickable={paginationClickable}
                >
                    {element.elements.map((carousel, index) => (
                        <swiper-slide key={index}>
                            <div className="carousel-element-wrapper">
                                <Elements element={{ ...element, elements: [carousel] }} />
                            </div>
                        </swiper-slide>
                    ))}
                </swiper-container>
            </CarouselWrapper>
        );
    });
};
