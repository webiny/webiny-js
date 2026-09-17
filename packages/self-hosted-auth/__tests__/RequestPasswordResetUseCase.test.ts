import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/feature/api";
import { Hasher } from "@webiny/api-core/features/hashing/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { CredentialsRepositoryFeature } from "~/api/repositories/CredentialsRepository.js";
import { createInMemoryCredentials } from "./helpers/inMemoryCredentials.js";
import type { StorageCredential } from "~/api/storage/credentials/index.js";
import { PasswordResetCodesRepositoryFeature } from "~/api/repositories/PasswordResetCodesRepository.js";
import { PasswordResetCodeGenerator } from "~/api/domain/crypto/PasswordResetCodeGenerator.js";
import { PasswordResetMailer } from "~/api/domain/mail/PasswordResetMailer.js";
import { RESET_REQUESTS_PER_WINDOW } from "~/api/domain/passwordResetPolicy.js";
import { RESET_REQUEST_MIN_DURATION_MS } from "~/api/domain/passwordResetPolicy.js";
import {
    RequestPasswordResetFeature,
    RequestPasswordResetUseCase
} from "~/api/features/RequestPasswordReset/index.js";
import { createInMemoryPasswordResetCodes } from "./helpers/inMemoryPasswordResetCodes.js";

const EMAIL = "admin@example.com";
const CODE = "424242";

const credential: StorageCredential = {
    userId: "user-123",
    email: EMAIL,
    passwordHash: "scrypt$16384$8$1$c2FsdA==$aGFzaA==",
    createdOn: "2026-01-01T00:00:00.000Z",
    updatedOn: "2026-01-01T00:00:00.000Z"
};

interface SetupOptions {
    credential?: StorageCredential | null;
    mailerConfigured?: boolean;
    sendSucceeds?: boolean;
}

const setup = (options: SetupOptions = {}) => {
    const container = new Container();

    const codes = createInMemoryPasswordResetCodes();
    const send = vi.fn(async () => options.sendSucceeds ?? true);
    const logError = vi.fn();

    codes.register(container);

    // The real repositories over the in-memory stores, so these cases cover the layers the use case
    // actually talks to rather than stand-ins for them.
    PasswordResetCodesRepositoryFeature.register(container);

    const seededCredentials = options.credential ? [options.credential] : [];
    createInMemoryCredentials(seededCredentials).register(container);
    CredentialsRepositoryFeature.register(container);

    container.registerInstance(PasswordResetCodeGenerator, { generate: () => CODE });

    container.registerInstance(Hasher, {
        hash: async (value: string) => `hashed:${value}`,
        verify: async (value: string, storedHash: string) => `hashed:${value}` === storedHash
    });

    container.registerInstance(PasswordResetMailer, {
        isConfigured: async () => options.mailerConfigured ?? true,
        send
    });

    container.registerInstance(Logger, {
        info: vi.fn(),
        warn: vi.fn(),
        error: logError,
        debug: vi.fn(),
        trace: vi.fn(),
        fatal: vi.fn()
    } as never);

    RequestPasswordResetFeature.register(container);

    const useCase = container.resolve(RequestPasswordResetUseCase);

    /**
     * Every answer is held to `RESET_REQUEST_MIN_DURATION_MS` so its timing says nothing. On a fake
     * clock that costs nothing, which is why these cases run it this way: waiting for real would
     * add a second per case for a delay that has its own two tests below.
     */
    const request = async (email: string) => {
        const result = useCase.execute({ email });
        await vi.advanceTimersByTimeAsync(RESET_REQUEST_MIN_DURATION_MS);

        return result;
    };

    return {
        useCase,
        request,
        codes,
        send,
        logError
    };
};

describe("RequestPasswordResetUseCase", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("emails a code when the address has an account", async () => {
        const { request, send } = setup({ credential });

        const result = await request(EMAIL);

        expect(result.isFail()).toBe(false);
        expect(send).toHaveBeenCalledWith({ email: EMAIL, code: CODE });
    });

    it("stores only a hash of the code, never the code", async () => {
        const { request, codes } = setup({ credential });

        await request(EMAIL);

        expect(codes.rows[0]!.codeHash).toBe(`hashed:${CODE}`);
        // No field carries the code itself. Checked field by field rather than over the serialized
        // row, because the fake hasher spells the value it was given into its output and a real one
        // would not.
        expect(Object.values(codes.rows[0]!)).not.toContain(CODE);
    });

    /**
     * The point of the whole design. Somebody working through a list of addresses has to get the
     * same answer for every one of them, or this screen becomes a way to find out who has an
     * account here.
     */
    it("answers an unknown address exactly as it answers a known one", async () => {
        const known = await setup({ credential }).request(EMAIL);
        const unknown = await setup({ credential: null }).request("nobody@example.com");

        expect(known.isFail()).toBe(false);
        expect(unknown.isFail()).toBe(false);
    });

    it("sends nothing when the address has no account", async () => {
        const { request, send } = setup({ credential: null });

        await request("nobody@example.com");

        expect(send).not.toHaveBeenCalled();
    });

    /**
     * Follows from the identical responses above. If rows existed only for real accounts, the
     * request limit would start answering the question the responses refuse to.
     */
    it("records the request for an address with no account, so the limit counts it", async () => {
        const { request, codes } = setup({ credential: null });

        await request("nobody@example.com");

        expect(codes.rows).toHaveLength(1);
    });

    it("stops issuing codes once the window is full", async () => {
        const { request } = setup({ credential });

        for (let attempt = 0; attempt < RESET_REQUESTS_PER_WINDOW; attempt++) {
            const allowed = await request(EMAIL);
            expect(allowed.isFail()).toBe(false);
        }

        const refused = await request(EMAIL);

        expect(refused.isFail()).toBe(true);
        expect(refused.isFail() && refused.error.code).toBe("TOO_MANY_RESET_REQUESTS");
    });

    it("counts the limit per address, not across all of them", async () => {
        const { request } = setup({ credential });

        for (let attempt = 0; attempt < RESET_REQUESTS_PER_WINDOW; attempt++) {
            await request(EMAIL);
        }

        const other = await request("someone.else@example.com");

        expect(other.isFail()).toBe(false);
    });

    /**
     * Capitals are the obvious way around a per-address limit, so the rows are keyed on a
     * lowercased address. Credentials are still looked up as typed, which is what login does.
     */
    it("counts addresses that differ only in capitals as one", async () => {
        const { request } = setup({ credential });

        for (let attempt = 0; attempt < RESET_REQUESTS_PER_WINDOW; attempt++) {
            await request(EMAIL);
        }

        const shouted = await request(EMAIL.toUpperCase());

        expect(shouted.isFail()).toBe(true);
        expect(shouted.isFail() && shouted.error.code).toBe("TOO_MANY_RESET_REQUESTS");
    });

    it("refuses before looking at the address when the installation cannot send mail", async () => {
        const { request, codes, send } = setup({ credential, mailerConfigured: false });

        const result = await request(EMAIL);

        expect(result.isFail()).toBe(true);
        expect(result.isFail() && result.error.code).toBe("MAILER_NOT_CONFIGURED");
        expect(codes.rows).toHaveLength(0);
        expect(send).not.toHaveBeenCalled();
    });

    it("names the CLI escape hatch when mail is not configured", async () => {
        const { request } = setup({ credential, mailerConfigured: false });

        const result = await request(EMAIL);

        expect(result.isFail() && result.error.message).toContain("webiny reset-password");
    });

    /**
     * Delivery only ever fails for an address that has an account, so reporting it would say
     * plainly which addresses those are. It goes to the log, where the user cannot read it.
     */
    it("reports success but logs when the code could not be delivered", async () => {
        const { request, logError } = setup({ credential, sendSucceeds: false });

        const result = await request(EMAIL);

        expect(result.isFail()).toBe(false);
        expect(logError).toHaveBeenCalled();
    });

    /**
     * Everything before the last step costs the same for both, but only a real account gets an
     * email sent, and waiting on an SMTP server is time an attacker can measure. Every answer is
     * held to the same floor so there is nothing to measure.
     */
    it("answers no faster than the floor, so the wait says nothing", async () => {
        const { useCase } = setup({ credential: null });

        let settled = false;
        const run = useCase.execute({ email: "nobody@example.com" }).then(result => {
            settled = true;
            return result;
        });

        await vi.advanceTimersByTimeAsync(RESET_REQUEST_MIN_DURATION_MS - 1);
        expect(settled).toBe(false);

        await vi.advanceTimersByTimeAsync(1);
        await run;

        expect(settled).toBe(true);
    });

    /** The refusals wait too. A fast "no" would say the address had been asked about lately. */
    it("holds a refused request to the floor as well", async () => {
        const { useCase } = setup({ credential, mailerConfigured: false });

        let settled = false;
        const run = useCase.execute({ email: EMAIL }).then(result => {
            settled = true;
            return result;
        });

        await vi.advanceTimersByTimeAsync(RESET_REQUEST_MIN_DURATION_MS - 1);
        expect(settled).toBe(false);

        await vi.advanceTimersByTimeAsync(1);
        const result = await run;

        expect(result.isFail()).toBe(true);
    });
});
