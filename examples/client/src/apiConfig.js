export default app => {
    if (process.env.NODE_ENV === "production") {
        app.graphql.setConfig({
            uri: "/graphql",
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
            uri: "http://localhost:3000/graphql",
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
