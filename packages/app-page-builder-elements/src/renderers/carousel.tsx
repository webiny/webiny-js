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
    --swiper-pagination-bottom: 0;

    & swiper-slide {
        text-align: center;
        font-size: 18px;
        background: #fff;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    // We need to apply these styles because scripts for swiper js are being loaded with the delay
    // So after they were loaded carousel is being shifted because of the applied styles from swiper js
    // In order to fix that behaviour we have to manually apply styles for carousel so it won't shift on the page if the script is not loaded
    & swiper-container:not(.swiper-initialized) {
        margin-left: auto;
        margin-right: auto;
        position: relative;
        overflow: hidden;
        padding: 0;
        display: block;
    }

    & swiper-container:not(.swiper-initialized) {
        & swiper-slide:not(swiper-slide:first-of-type) {
            display: none;
        }
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
                "--swiper-pagination-bottom": "0",
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
