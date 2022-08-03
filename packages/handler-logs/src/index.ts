import fetch from "node-fetch";
import { HandlerResultPlugin } from "@webiny/api";

export default () => {
    const consoleLog = console.log;

    const logs: any[] = [];
    console.log = (...args: any) => {
        logs.push({
            args,
            meta: {
                functionName: process.env.AWS_LAMBDA_FUNCTION_NAME
            }
        });
        consoleLog(...args);
    };

    return new HandlerResultPlugin(async () => {
        const url = process.env.WEBINY_LOGS_FORWARD_URL;
        console.log(url);
        if (logs.length && typeof url === "string" && url.startsWith("http")) {
            try {
                await fetch(url, {
                    body: JSON.stringify(logs),
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Bypass-Tunnel-Reminder": "1"
                    }
                });
            } catch (err) {
                consoleLog(`Failed to send logs to "localtunnel"`, err.message);
            }
        }
        logs.length = 0;
    });
};
