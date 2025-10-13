import React, { useEffect, useState } from "react";
import { mouseTracker } from "@webiny/website-builder-sdk";

export const MouseStatus = () => {
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        return mouseTracker.subscribe(setPosition);
    }, []);

    return (
        <div className={"absolute bottom-0 left-0 p-md"}>
            {position.x}:{position.y}
        </div>
    );
};
