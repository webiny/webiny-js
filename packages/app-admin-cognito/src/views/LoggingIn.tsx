import React from "react";
import { CircularProgress } from "@webiny/ui/Progress";

const LoggingIn: React.VFC = () => {
    return <CircularProgress label={"Loading identity..."} />;
};

export default LoggingIn;
