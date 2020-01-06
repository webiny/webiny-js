// @flow
import * as React from "react";

const Slider = ({ data }: Object) => {
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
