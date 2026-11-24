import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { ApiGatewayEventHandler } from "@webiny/kernel-aws";
import { FunctionUrlStreamEventHandler } from "@webiny/kernel-aws";
import { LambdaResponseStream } from "@webiny/kernel-aws";
import { LambdaResponseStreamValue } from "@webiny/kernel-aws";
import type { IRawResponseStream } from "@webiny/kernel-aws";
import type { IResponseStreamMetadata } from "@webiny/kernel-aws";
import { RawAuthToken as RawAuthTokenImpl } from "@webiny/api-core/features/requestContext/RawAuthToken.js";
import { RequestIdentityLoader } from "@webiny/api-core/features/requestContext/index.js";
import { TokenExpiredError } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { ApiGatewayIdentityLoaderDecorator } from "~/handlers/ApiGatewayIdentityLoaderDecorator.js";
import { FunctionUrlStreamIdentityLoaderDecorator } from "~/handlers/FunctionUrlStreamIdentityLoaderDecorator.js";

const ORIGIN = "https://admin.example.com";
const HEADERS = { Origin: ORIGIN, Authorization: "Bearer expired-token" };

class FakeResponseStream implements IRawResponseStream {
    chunks: string[] = [];
    ended = false;

    write(chunk: Uint8Array | string): boolean {
        this.chunks.push(String(chunk));
        return true;
    }

    end(): void {
        this.ended = true;
    }
}

interface ISetupResult {
    container: Container;
    innerCalled: () => boolean;
}

function setup(establishError: Error): ISetupResult {
    const container = new Container();
    container.register(RawAuthTokenImpl).inSingletonScope();
    container.registerInstance(RequestIdentityLoader, {
        async establish() {
            throw establishError;
        }
    });

    let innerCalled = false;
    const inner = {
        async execute() {
            innerCalled = true;
            return { statusCode: 200, body: "" };
        }
    };
    container.registerInstance(ApiGatewayEventHandler, inner);
    container.registerInstance(FunctionUrlStreamEventHandler, inner);
    container.registerDecorator(ApiGatewayIdentityLoaderDecorator);
    container.registerDecorator(FunctionUrlStreamIdentityLoaderDecorator);

    return { container, innerCalled: () => innerCalled };
}

describe("ApiGatewayIdentityLoaderDecorator", () => {
    it("answers 401 with the error code and CORS headers when the token is rejected", async () => {
        const t = setup(new TokenExpiredError());
        const handler = t.container.resolve(ApiGatewayEventHandler);
        const event = { headers: HEADERS };

        const result = await handler.execute({ event, metadata: {} } as any, async () => undefined);

        expect(result.statusCode).toBe(401);
        expect(result.headers["access-control-allow-origin"]).toBe(ORIGIN);
        expect(result.headers["www-authenticate"]).toBe('Bearer error="invalid_token"');
        expect(JSON.parse(result.body)).toEqual({
            message: "Token has expired",
            code: "Authentication/TokenExpired",
            data: null
        });
        expect(t.innerCalled()).toBe(false);
    });

    it("lets an error that is not a rejected token propagate", async () => {
        const t = setup(new Error("JWKS request timed out"));
        const handler = t.container.resolve(ApiGatewayEventHandler);
        const event = { headers: HEADERS };

        const run = handler.execute({ event, metadata: {} } as any, async () => undefined);

        await expect(run).rejects.toThrow("JWKS request timed out");
    });
});

describe("FunctionUrlStreamIdentityLoaderDecorator", () => {
    let prelude: IResponseStreamMetadata | null;

    beforeEach(() => {
        prelude = null;
        (globalThis as any).awslambda = {
            streamifyResponse: (handler: unknown) => handler,
            HttpResponseStream: {
                from: (stream: IRawResponseStream, metadata: IResponseStreamMetadata) => {
                    prelude = metadata;
                    return stream;
                }
            }
        };
    });

    afterEach(() => {
        delete (globalThis as any).awslambda;
    });

    it("writes a 401 with the error code and CORS headers to the stream when the token is rejected", async () => {
        const t = setup(new TokenExpiredError());
        const stream = new FakeResponseStream();
        const streamValue = new LambdaResponseStreamValue(stream);
        t.container.registerInstance(LambdaResponseStream, streamValue);
        const handler = t.container.resolve(FunctionUrlStreamEventHandler);
        const event = { headers: HEADERS };

        await handler.execute({ event, metadata: {} } as any, async () => undefined);

        expect(prelude?.statusCode).toBe(401);
        expect(prelude?.headers?.["access-control-allow-origin"]).toBe(ORIGIN);
        expect(JSON.parse(stream.chunks.join(""))).toEqual({
            message: "Token has expired",
            code: "Authentication/TokenExpired",
            data: null
        });
        expect(stream.ended).toBe(true);
        expect(t.innerCalled()).toBe(false);
    });

    it("lets an error that is not a rejected token propagate", async () => {
        const t = setup(new Error("JWKS request timed out"));
        const stream = new FakeResponseStream();
        const streamValue = new LambdaResponseStreamValue(stream);
        t.container.registerInstance(LambdaResponseStream, streamValue);
        const handler = t.container.resolve(FunctionUrlStreamEventHandler);
        const event = { headers: HEADERS };

        const run = handler.execute({ event, metadata: {} } as any, async () => undefined);

        await expect(run).rejects.toThrow("JWKS request timed out");
        expect(prelude).toBeNull();
    });
});
