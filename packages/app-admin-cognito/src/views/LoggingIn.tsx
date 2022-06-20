import React from "react";
import { CircularProgress } from "@webiny/ui/Progress";

const LoggingIn: React.FC = () => {
    return <CircularProgress label={"Loading identity..."} />;
};

export default LoggingIn;
