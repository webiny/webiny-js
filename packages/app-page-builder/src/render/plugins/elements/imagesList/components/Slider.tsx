/**
 * There is no slick slider imported anywhere. How?
 */
// TODO @ts-refactor
// TODO remove
// @ts-nocheck
/* eslint-disable */

import * as React from "react";
import { Image } from "react-images";

interface SliderProps {
    data: Image[];
}
const Slider: React.VFC<SliderProps> = ({ data }) => {
    if (Array.isArray(data)) {
        const settings = {
            dots: true,
            infinite: true,
            speed: 500,
            slidesToShow: 1,
            slidesToScroll: 1
        };

        return (
            <div>
                {Array.isArray(data) && (
                    <SlickSlider {...settings}>
                        {data.map((item, index) => (
                            <div key={item.src + index}>
                                <img style={{ width: "100%" }} src={item.src} />
                            </div>
                        ))}
                    </SlickSlider>
                )}
            </div>
        );
    }
    return null;
};

export default Slider;
