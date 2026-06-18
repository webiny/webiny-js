import React from "react";
import { Plugins } from "@webiny/app";
import { HandleWebsocketMessages } from "./HandleWebsocketMessages.js";

export const AiEnrichmentModule = () => {
    return (
        <Plugins>
            <HandleWebsocketMessages />
        </Plugins>
    );
};
