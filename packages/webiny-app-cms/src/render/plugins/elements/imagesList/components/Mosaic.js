// @flow
import * as React from "react";
import { Mosaic as UiMosaic } from "webiny-ui/Mosaic";

export default function Mosaic(props) {
    const { data } = props;

    if (Array.isArray(data)) {
        return (
            <UiMosaic>
                {data.map((item, i) => (
                    <img
                        style={{ width: "100%", display: "block" }}
                        key={i + item.src}
                        src={item.src}
                    />
                ))}
            </UiMosaic>
        );
    }
    return <span>No images.</span>;
}
