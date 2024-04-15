import React from "react";
import { GenericBlock, ThreeGridBoxBlock } from "@demo/shared";

export const isThreeGridBoxBlock = (block: GenericBlock): block is ThreeGridBoxBlock => {
    return block.__typename === "Article_Content_ThreeGridBox";
};

export const ThreeGridBoxBlockComponent = ({ block }: { block: ThreeGridBoxBlock }) => {
    return (
        <div>
            {block.boxes.map((box, index) => {
                return (
                    <div key={index}>
                        <h3>{box.title}</h3>
                        <p>{box.description}</p>
                        {box.icon ? <img src={box.icon} alt={box.title} /> : null}
                    </div>
                );
            })}
        </div>
    );
};
