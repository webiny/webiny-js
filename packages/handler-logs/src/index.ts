import fetch from "node-fetch";
const consoleLog = console.log;

const logs = [];
console.log = (...args) => {
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
        if (url && logs.length) {
            await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Bypass-Tunnel-Reminder": "1"
                },
                body: JSON.stringify(logs)
            });
        }
        logs.length = 0;
    }
});
