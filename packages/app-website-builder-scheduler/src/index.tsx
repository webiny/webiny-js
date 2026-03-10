import React from "react";
import { PageSchedulerExtension } from "./integration/PageSchedulerExtension.js";

export const createWbScheduler = () => {
    return [<PageSchedulerExtension key={"wb-scheduler-extension"} />];
};

export { WbScheduler } from "./Presentation/index.js";
