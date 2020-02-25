import React from "react";

const tryRenderingPlugin = fn => {
    // console.log(fn.name);
    try {
        // if (fn.name === "asd") throw new Error("error1238523");
        return fn();
    } catch (err) {
        console.log(err);
        return (
            <div style={{ padding: "15px", color: "rgb(206, 17, 38)" }}>
                <div style={{ fontSize: "2.0em", paddingBottom: "5px" }}>
                    An error has occurred: {err.message}
                </div>
                <div style={{ fontSize: "1.3em", color: "rgb(206, 17, 38)", padding: "10px" }}>
                    Check the console for more information regarding the error.
                </div>
            </div>
        );
    }
};

export default tryRenderingPlugin;
