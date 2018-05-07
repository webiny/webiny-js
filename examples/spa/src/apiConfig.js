export default app => {
    if (process.env.NODE_ENV === "production") {
        app.graphql.setConfig({
            uri: "https://2z2788jepi.execute-api.eu-west-1.amazonaws.com/dev/graphql",
            defaultOptions: {
                watchQuery: {
                    fetchPolicy: "network-only",
                    errorPolicy: "all"
                },
                query: {
                    fetchPolicy: "network-only",
                    errorPolicy: "all"
                }
            }
        });
    }

    if (process.env.NODE_ENV === "development") {
        app.graphql.setConfig({
            uri: "http://localhost:9000/graphql",
            defaultOptions: {
                watchQuery: {
                    fetchPolicy: "network-only",
                    errorPolicy: "all"
                },
                query: {
                    fetchPolicy: "network-only",
                    errorPolicy: "all"
                }
            }
        });
    }
};
