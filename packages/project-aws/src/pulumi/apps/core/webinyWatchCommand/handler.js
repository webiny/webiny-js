exports.handler = async event => {
    const urlParams = new URLSearchParams(event.protocolData.http.queryString);

    const WBY_WATCH_COMMAND_TOPIC = process.env.WBY_WATCH_COMMAND_TOPIC;
    if (urlParams.get("x-webiny-watch-command-topic") !== WBY_WATCH_COMMAND_TOPIC) {
        return {
            isAuthenticated: false
        };
    }

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
                        Resource: [`arn:aws:iot:*:*:topicfilter/${WBY_WATCH_COMMAND_TOPIC}`]
                    },
                    {
                        Effect: "Allow",
                        Action: "iot:Publish",
                        Resource: [`arn:aws:iot:*:*:topic/${WBY_WATCH_COMMAND_TOPIC}`]
                    },
                    {
                        Effect: "Allow",
                        Action: ["iot:Receive"],
                        Resource: [`arn:aws:iot:*:*:topic/${WBY_WATCH_COMMAND_TOPIC}`]
                    }
                ]
            }
        ],
        disconnectAfterInSeconds: 3600,
        refreshAfterInSeconds: 300
    };
};
