import fetch from "node-fetch";
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

export default () => ({
    type: "handler-result",
    async apply() {
        const url = process.env.WEBINY_LOGS_FORWARD_URL;
        if (logs.length && typeof url === "string" && url.startsWith("http")) {
            try {
                const body = JSON.stringify(logs);
                await fetch(url, {
                    body,
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Bypass-Tunnel-Reminder": "1"
                    }
                });
            } catch {
                // Do nothing.
            }
        }
        logs.length = 0;
    }
});
