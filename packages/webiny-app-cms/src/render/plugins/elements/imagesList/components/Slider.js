// @flow
import * as React from "react";
import { default as SlickSlider } from "react-slick";
import "./Slider.scss";
import { css } from "emotion";

const style = css({
    minWidth: 100,
    maxWidth: 500
});

/**
 * TODO: Issues with sliders @sven
 * When the Slider is mounted, its width is like 300k pixels (width of the container set to 100%).
 * If min-width is not set, slider is not even shown until you scroll the window.
 *
 * That's why the upper "style" is applied to SlickSlider component.
 */

const Slider = ({ data }: Object) => {
    if (Array.isArray(data)) {
        const settings = {
            dots: true,
            infinite: true,
            speed: 500,
            slidesToShow: 1,
            slidesToScroll: 1,
            adaptiveHeight: true
        };

        return (
            <SlickSlider {...settings} className={"webiny-images-list-slider " + style}>
                {data.map((item, index) => (
                    <div key={item.src + index}>
                        <img style={{ width: "100%" }} src={item.src} />
                    </div>
                ))}
            </SlickSlider>
        );
    }
    return null;
};

export default Slider;
