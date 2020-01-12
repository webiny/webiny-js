import * as React from "react";
import { DialogContainer } from "./Dialog";

export default (type: string) => ({
    name: "dialog-" + type,
    type,
    render() {
        return <DialogContainer />;
    }
});
