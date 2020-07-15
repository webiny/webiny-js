import React from "react";

export default {
    // TODO [Andrei] should I also update the plugin's name automatically based on the package's name?
    name: "sample-react-app-[PACKAGE_NAME]",
    type: "sample-react-app",
    render() {
        return (<h1>
            This is a sample React App
        </h1>);
    }
};
