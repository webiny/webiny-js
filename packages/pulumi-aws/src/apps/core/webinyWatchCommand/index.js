module.exports.handler = async event => {
    const urlParams = new URLSearchParams(event.protocolData.http.queryString);

    const WEBINY_WATCH_COMMAND_TOPIC = process.env.WEBINY_WATCH_COMMAND_TOPIC;
    if (urlParams["x-webiny-watch-command-topic"] !== WEBINY_WATCH_COMMAND_TOPIC) {
        return {
            isAuthenticated: false
        };
    }

    console.log(urlParams);
    return {
        isAuthenticated: true,
        principalId: "Unauthenticated",
        policyDocuments: [
            {
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Action: "iot:Connect",
                        Resource: "arn:aws:iot:*:*:client/*"
                    },
                    {
                        Effect: "Allow",
                        Action: "iot:Subscribe",
                        Resource: [`arn:aws:iot:*:*:topicfilter/${WEBINY_WATCH_COMMAND_TOPIC}`]
                    },
                    {
                        Effect: "Allow",
                        Action: "iot:Publish",
                        Resource: [`arn:aws:iot:*:*:topic/${WEBINY_WATCH_COMMAND_TOPIC}`]
                    },
                    {
                        Effect: "Allow",
                        Action: ["iot:Receive"],
                        Resource: [`arn:aws:iot:*:*:topic/${WEBINY_WATCH_COMMAND_TOPIC}`]
                    }
                ]
            }
        ],
        disconnectAfterInSeconds: 3600,
        refreshAfterInSeconds: 300
    };
};
