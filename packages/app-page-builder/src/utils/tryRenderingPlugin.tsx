import React from "react";

const tryRenderingPlugin = fn => {
    try {
        // if (fn.name === "asd") throw new Error("error1238523");
        return fn();
    } catch (err) {
        console.log(err);
        return (
            <div style={{ paddingTop: "15px", paddingBottom: "15px", color: "rgb(206, 17, 38)" }}>
                <div style={{ fontSize: "1.5em", paddingBottom: "5px" }}>
                    An error has occurred: {err.message}
                </div>
                <div style={{ fontSize: "1.1em", color: "rgb(206, 17, 38)" }}>
                    Check the console for more information regarding the error.
                </div>
            </div>
        );
    }
};

export default tryRenderingPlugin;
