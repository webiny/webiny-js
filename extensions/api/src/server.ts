import { createServer, RoutePlugin } from "@webiny/handler-node";

const port = Number.parseInt(process.env.PORT ?? "8080", 10);
const host = process.env.HOST ?? "0.0.0.0";

const server = createServer({
    plugins: [
        new RoutePlugin(({ onGet }) => {
            onGet("/hello", async (_, reply) => {
                return reply.send({ message: "hello from container" });
            });
        })
    ],
    host,
    port
});

const url = await server.listen();
console.log(`Webiny container API listening on ${url}`);
