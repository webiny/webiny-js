import React from "react";
import Snackbar from "./Snackbar";

export default type => ({
    name: "snackbar-" + type,
    type,
    render() {
        return <Snackbar />;
    }
});