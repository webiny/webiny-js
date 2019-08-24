// @flow
import React from "react";
import Dialog from "./Dialog";

export default (type: string) => ({
    name: "dialog-" + type,
    type,
    render() {
        return <Dialog />;
    }
});
