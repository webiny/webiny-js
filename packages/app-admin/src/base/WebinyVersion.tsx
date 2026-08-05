import React from "react";
import { config as appConfig } from "@webiny/app/config.js";

export const WebinyVersion = () => {
    const wbyVersion = appConfig.getKey("WEBINY_VERSION", process.env.REACT_APP_WEBINY_VERSION);

    // TODO: WCP badge temporarily removed during feature flags migration.
    // const wcp = useWcp();
    // const wcpBadge = wcp.getProject() ? <Tag variant="accent" content="WCP" /> : null;

    return <div className={"flex items-center"}>Webiny v{wbyVersion}</div>;
};
