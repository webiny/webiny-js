// @flow
import * as React from "react";
// import { Carousel } from "webiny-ui/Carousel";
import Carousel from "nuka-carousel";
const Slider = ({ data }: Object) => {
    if (Array.isArray(data)) {
        return (
            <div style={{ width: "100%", height: "auto", minHeight: 200 }}>
                <Carousel>
                    {Array.isArray(data) && data.map(item => <img key={item.src} src={item.src} />)}
                </Carousel>
            </div>
        );
    }
    return null;
};

export default Slider;
