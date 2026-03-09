import React from "react";
import { CliCommand } from "@webiny/cli-core/extensions/index.js";

export const McpExtension = () => {
    return (
        <>
            <CliCommand src={import.meta.dirname + "/cli/ConfigureMcp.js"} />
            <CliCommand src={import.meta.dirname + "/cli/McpServer.js"} />
        </>
    );
};
