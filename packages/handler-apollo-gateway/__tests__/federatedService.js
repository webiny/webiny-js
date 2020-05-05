const { ApolloServer, gql } = require("apollo-server-lambda");
const { buildFederatedSchema } = require("@apollo/federation");

const users = [
    {
        id: "1",
        name: "Ada Lovelace",
        birthDate: "1815-12-10",
        username: "@ada"
    },
    {
        id: "2",
        name: "Alan Turing",
        birthDate: "1912-06-23",
        username: "@complete"
    }
];

const event = {
    resource: "/graphql",
    path: "/graphql",
    httpMethod: "POST",
    headers: {
        accept: "*/*",
        "accept-encoding": "br, gzip, deflate",
        "accept-language": "en-US,en;q=0.9,hr;q=0.8,ru;q=0.7,sr;q=0.6,bs;q=0.5,sl;q=0.4",
        "content-type": "application/json"
    },
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    stageVariables: null,
    requestContext: {
        resourceId: "r9xbvd",
        resourcePath: "/graphql",
        httpMethod: "POST",
        path: "/prod/graphql",
        protocol: "HTTP/1.1",
        stage: "prod"
    },
    body: '{"operationName":null,"variables":{},"query":"{\\n  users { id\\n name\\n }\\n}"}',
    isBase64Encoded: false
};

const startService = async () => {
    const typeDefs = gql`
        extend type Query {
            users: [User]
        }

        type User {
            id: ID!
            name: String
            username: String
        }
    `;

    const resolvers = {
        Query: {
            users() {
                return users;
            }
        }
    };

    const apollo = new ApolloServer({
        schema: buildFederatedSchema([
            {
                typeDefs,
                resolvers
            }
        ])
    });

    const handler = apollo.createHandler({
        cors: {
            origin: "*",
            methods: "GET,HEAD,POST"
        }
    });

    return { handler, event };
};

const startServiceWithError = async () => {
    const typeDefs = gql`
        extend type Query {
            users: [User]
        }

        type User {
            id: ID!
            name: String
            username: String
        }
    `;

    const resolvers = {
        Query: {
            users() {
                return users;
            }
        }
    };

    const server = new ApolloServer({
        schema: buildFederatedSchema([
            {
                typeDefs,
                resolvers
            }
        ]),
        context() {
            throw Error("Request failed!");
        }
    });

    const { url } = await server.listen({ port: 4002 });
    return { url, event, stop: () => server.stop() };
};

module.exports = { startService, startServiceWithError };
