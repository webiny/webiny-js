import React from "react";
import TopProgressBar from "./TopProgressBar";

// Export plugin creator
export default type => ({
    name: "top-progress-bar-" + type,
    type,
    render() {
        return <TopProgressBar />;
    }
});
