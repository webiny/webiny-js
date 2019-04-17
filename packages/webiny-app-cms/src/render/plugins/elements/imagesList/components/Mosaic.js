// @flow
import * as React from "react";

const Mosaic = ({ data }: Object) => {
    if (Array.isArray(data)) {
        return (
            <div id={"kobaja"}>
                {data.map(item => (
                    <div key={item.src} className="grid-item">
                        <img src={item.src} />
                    </div>
                ))}
            </div>
        );
    }
    return <span>nema slika</span>;
};

export default Mosaic;
