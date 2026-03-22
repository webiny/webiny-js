import React from "react";
import { DevToolsSection } from "@webiny/react-properties";
import { RouteElementRegistry, useRoute } from "~/presentation/router/index.js";
import { useContainer } from "~/shared/di/DiContainerProvider.js";

export const RouteContent = () => {
    const { route } = useRoute();
    const container = useContainer();
    const elementRegistry = container.resolve(RouteElementRegistry);

    if (!route) {
        return null;
    }

    const element = elementRegistry.getElement(route.name);

    return (
        <>
            <DevToolsSection name={"Current Route"} group={"Router"} data={route} views={"raw"} />
            {element ?? null}
        </>
    );
};
