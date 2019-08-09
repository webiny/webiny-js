import { ApolloGateway, RemoteGraphQLDataSource } from "@apollo/gateway";
import { ApolloServer } from "apollo-server-lambda";

function readableBytes(bytes) {
    const i = Math.floor(Math.log(bytes) / Math.log(1024)),
        sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    return (bytes / Math.pow(1024, i)).toFixed(2) * 1 + " " + sizes[i];
}

const logMemory = prefix => {
    console.log(`===> HEAP USED [${prefix}]`, readableBytes(process.memoryUsage().heapUsed));
};

const host = process.env.FUNCTIONS_HOST;

const gateway = new ApolloGateway({
    serviceList: [
        //{ name: "pageBuilder", url: host + "/function/page-builder" },
        //{ name: "security", url: host + "/function/security" },
        { name: "files", url: host + "/function/files" }
        //{ name: "headless", url: host + "/function/headless" }
    ],
    buildService({ url }) {
        return new RemoteGraphQLDataSource({
            url,
            willSendRequest({ request, context }) {
                Object.keys(context.headers).forEach(key => {
                    request.http.headers.set(key, context.headers[key]);
                });
            }
        });
    }
});

export const handler = async (event, context) => {
    logMemory("Before demo-api-gateway");
    const { schema, executor } = await gateway.load();

    let apollo = new ApolloServer({
        schema,
        executor,
        introspection: true,
        playground: true,
        context: async ({ event }) => {
            return { headers: event.headers };
        }
    });

    let apolloHandler = apollo.createHandler();

    return new Promise((resolve, reject) => {
        apolloHandler(event, context, (error, data) => {
            if (error) {
                return reject(error);
            }

            logMemory("After demo-api-gateway");

            apollo = null;
            apolloHandler = null;

            resolve(data);
        });
    });
};
