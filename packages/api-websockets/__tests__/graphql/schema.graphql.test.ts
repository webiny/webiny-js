import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler";

describe("schema graphql", () => {
    it("should have websockets schema", async () => {
        const { introspect } = useGraphQLHandler();
        const [schema] = await introspect();

        const types: string[] = [
            "WebsocketsIdentity",
            "WebsocketsConnection",
            "WebsocketsError",
            "WebsocketsListConnectionsResponse",
            "WebsocketsListConnectionsWhereInput",
            "WebsocketsQuery",
            "WebsocketsDisconnectResponse",
            "WebsocketsMutation"
        ];

        for (const type of types) {
            expect(schema.data.__schema.types.some((t: any) => t.name === type)).toBeTruthy();
        }

        expect.assertions(types.length);
    });
});
