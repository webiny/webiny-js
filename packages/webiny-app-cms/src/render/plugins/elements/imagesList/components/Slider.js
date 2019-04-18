// @flow
import * as React from "react";
import { Carousel } from "webiny-ui/Carousel";
const Slider = ({ data }: Object) => {
    if (Array.isArray(data)) {
        return (
            <div className={"bajo"} style={{ height: 500 }}>
                {Array.isArray(data) && (
                    <Carousel>
                        {data.map(item => (
                            <img style={{ width: "100%" }} key={item.src} src={item.src} />
                        ))}
                    </Carousel>
                )}
            </div>
        );
    }
    return null;
};

export default Slider;
