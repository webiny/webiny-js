import mockConsole from "jest-mock-console";
import gql from "graphql-tag";
import { createHandler } from "@webiny/handler";
import apolloServerPlugins from "../src/index";
import event from "./event.mock";
const context = {};
const methods = ["log", "info", "warn"];

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

describe("Apollo Server Handler", () => {
    test("should setup apollo server and return response", async () => {
        const restoreConsole = mockConsole(methods);

        const handler = createHandler(apolloServerPlugins({ debug: true }), {
            type: "graphql-schema",
            name: "graphql-schema-test",
            schema: {
                typeDefs: gql`
                    extend type Query {
                        users: [User]
                    }

                    type User {
                        id: ID!
                        name: String
                        username: String
                    }
                `,
                resolvers: {
                    Query: {
                        users() {
                            return users;
                        }
                    }
                }
            }
        });

        const res = await handler(event, context);
        restoreConsole();

        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toMatchObject({
            data: {
                users: [
                    {
                        id: "1",
                        name: "Ada Lovelace"
                    },
                    {
                        id: "2",
                        name: "Alan Turing"
                    }
                ]
            }
        });
    });
});
