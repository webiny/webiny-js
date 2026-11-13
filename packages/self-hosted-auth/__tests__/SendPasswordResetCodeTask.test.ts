import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { Hasher } from "@webiny/api-core/features/hashing/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { TaskHandler } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { CredentialsRepositoryFeature } from "~/api/repositories/CredentialsRepository.js";
import { PasswordResetCodesRepositoryFeature } from "~/api/repositories/PasswordResetCodesRepository.js";
import type { StorageCredential } from "~/api/storage/credentials/index.js";
import { PasswordResetCodeGenerator } from "~/api/domain/crypto/PasswordResetCodeGenerator.js";
import { PasswordResetMailer } from "~/api/domain/mail/PasswordResetMailer.js";
import { SetPasswordUseCase } from "~/api/features/SetPassword/index.js";
import { RequestPasswordResetFeature } from "~/api/features/RequestPasswordReset/index.js";
import { RequestPasswordResetUseCase } from "~/api/features/RequestPasswordReset/index.js";
import { ResetPasswordWithCodeFeature } from "~/api/features/ResetPasswordWithCode/index.js";
import { ResetPasswordWithCodeUseCase } from "~/api/features/ResetPasswordWithCode/index.js";
import { SendPasswordResetCodeFeature } from "~/api/features/SendPasswordResetCode/index.js";
import { SendPasswordResetCodeUseCase } from "~/api/features/SendPasswordResetCode/index.js";
import type { SendPasswordResetCodeInput } from "~/api/features/SendPasswordResetCode/index.js";
import type { SendPasswordResetCodeParams } from "~/api/domain/mail/PasswordResetMailer.js";
import { createInMemoryCredentials } from "./helpers/inMemoryCredentials.js";
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

interface TaskResponse {
    status: string;
}

// The two responses the handler uses, returning plain objects a case can assert on.
const controller = {
    response: {
        done: (): TaskResponse => ({ status: "done" }),
        error: (error: { message: string }) => ({ status: "error", error })
    }
};

interface SetupOptions {
    credential?: StorageCredential | null;
    sendSucceeds?: boolean;
}

/*
 * The request use case, the task and the code check over one set of in-memory stores, with the
 * task service queueing triggers instead of running them, so a case runs the task when it chooses.
 */
const setup = (options: SetupOptions = {}) => {
    const container = new Container();

    const codes = createInMemoryPasswordResetCodes();
    codes.register(container);
    PasswordResetCodesRepositoryFeature.register(container);

    const resolved = options.credential === undefined ? credential : options.credential;
    const seededCredentials = resolved ? [resolved] : [];
    createInMemoryCredentials(seededCredentials).register(container);
    CredentialsRepositoryFeature.register(container);

    container.registerInstance(PasswordResetCodeGenerator, { generate: () => CODE });
    container.registerInstance(Hasher, {
        hash: async (value: string) => `hashed:${value}`,
        verify: async (value: string, storedHash: string) => `hashed:${value}` === storedHash
    });

    const sent: SendPasswordResetCodeParams[] = [];
    const send = vi.fn(async (params: SendPasswordResetCodeParams) => {
        sent.push(params);
        return options.sendSucceeds ?? true;
    });
    container.registerInstance(PasswordResetMailer, { isConfigured: async () => true, send });

    const logError = vi.fn();
    const logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: logError,
        debug: vi.fn(),
        trace: vi.fn(),
        fatal: vi.fn()
    } as unknown as Logger.Interface;
    container.registerInstance(Logger, logger);

    const queued: SendPasswordResetCodeInput[] = [];
    const taskService = {
        trigger: async (params: { input: SendPasswordResetCodeInput }) => {
            queued.push(params.input);
            return Result.ok({ id: `task-${queued.length}` });
        }
    } as unknown as TaskService.Interface;
    container.registerInstance(TaskService, taskService);

    const setPassword = vi.fn(async () => Result.ok(true as const));
    container.registerInstance(SetPasswordUseCase, { execute: setPassword });

    RequestPasswordResetFeature.register(container);
    SendPasswordResetCodeFeature.register(container);
    ResetPasswordWithCodeFeature.register(container);

    const definition = container.resolve(TaskDefinition);
    const handler = container.resolveImplementation(definition.handler);

    const runTask = async (input: SendPasswordResetCodeInput): Promise<TaskResponse> => {
        const params = { input, controller, definition } as unknown as TaskHandler.RunParams;
        return (await handler.run(params)) as unknown as TaskResponse;
    };

    const reset = (code: string) => {
        const useCase = container.resolve(ResetPasswordWithCodeUseCase);
        return useCase.execute({ email: EMAIL, code, password: "long-enough-password" });
    };

    return {
        request: (email: string) =>
            container.resolve(RequestPasswordResetUseCase).execute({ email }),
        sendCode: container.resolve(SendPasswordResetCodeUseCase),
        reset,
        runTask,
        queued,
        codes,
        sent,
        send,
        setPassword,
        logError,
        definition
    };
};

describe("SendPasswordResetCodeTask", () => {
    it("emails a code to an address with an account and stores only its hash", async () => {
        const { request, runTask, queued, codes, send } = setup();

        await request(EMAIL);
        const result = await runTask(queued[0]!);

        expect(result.status).toBe("done");
        expect(send).toHaveBeenCalledWith({ email: EMAIL, code: CODE });
        expect(codes.rows[0]!.codeHash).toBe(`hashed:${CODE}`);
        const storedValues = Object.values(codes.rows[0]!);
        expect(storedValues).not.toContain(CODE);
    });

    it("emails nothing and stores no code when the address has no account", async () => {
        const { request, sendCode, queued, codes, send } = setup({ credential: null });

        await request("nobody@example.com");
        const result = await sendCode.execute(queued[0]!);

        expect(result.isOk() && result.value).toBe("noAccount");
        expect(send).not.toHaveBeenCalled();
        expect(codes.rows[0]!.codeHash).toBeNull();
    });

    it("sends the code that resets the password", async () => {
        const { request, runTask, queued, sent, reset, setPassword } = setup();

        await request(EMAIL);
        await runTask(queued[0]!);
        const result = await reset(sent[0]!.code);

        expect(result.isFail()).toBe(false);
        expect(setPassword).toHaveBeenCalled();
    });

    it("does not accept a code before the task has run", async () => {
        const { request, reset, setPassword } = setup();

        await request(EMAIL);
        const result = await reset(CODE);

        expect(result.isFail() && result.error.code).toBe("INVALID_RESET_CODE");
        expect(setPassword).not.toHaveBeenCalled();
    });

    /*
     * A second run would mint a second code. Only the first is stored, so mailing the second would
     * hand the user a code that cannot work.
     */
    it("mails nothing when run again for a request that already has a code", async () => {
        const { request, sendCode, queued, send } = setup();

        await request(EMAIL);
        await sendCode.execute(queued[0]!);
        const again = await sendCode.execute(queued[0]!);

        expect(again.isOk() && again.value).toBe("alreadyIssued");
        expect(send).toHaveBeenCalledTimes(1);
    });

    /*
     * Not reported to the person who asked. The request answered long ago, and the same way for
     * every address. The operator gets it from the log.
     */
    it("fails the task and logs when the code could not be delivered", async () => {
        const { request, runTask, queued, logError } = setup({ sendSucceeds: false });

        await request(EMAIL);
        const result = await runTask(queued[0]!);

        expect(result.status).toBe("error");
        expect(logError).toHaveBeenCalled();
    });

    // The task input holds the address. Nothing needs it once the task is over.
    it("is private, runs once and deletes itself when it ends", () => {
        const { definition } = setup();

        expect(definition.isPrivate).toBe(true);
        expect(definition.maxIterations).toBe(1);
        expect(definition.selfCleanup).toBe("always");
    });
});
