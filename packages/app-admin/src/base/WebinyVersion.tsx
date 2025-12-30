import React, { useMemo } from "react";
import { config as appConfig } from "@webiny/app/config.js";
import { useWcp } from "~/index.js";
import { Tag } from "@webiny/admin-ui";

export const WebinyVersion = () => {
    const wbyVersion = appConfig.getKey("WBY_VERSION", process.env.REACT_APP_WBY_VERSION);
    const wcp = useWcp();

    const wcpBadge = useMemo(() => {
        const wcpProject = wcp.getProject();
        if (!wcpProject) {
            return null;
        }

        return <Tag variant={"accent"} content={"WCP"} className={"ml-sm-extra"} />;
    }, []);

    return (
        <div className={"flex items-center"}>
            Webiny v{wbyVersion}
            {wcpBadge}
        </div>
    );
};
