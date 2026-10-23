import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { BackgroundTaskEventHandler } from "@webiny/event-handler-core";
import { RequestContainer } from "@webiny/event-handler-core";
import type { IBackgroundTaskEvent } from "@webiny/event-handler-core";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { RawTenantId } from "@webiny/api-core/features/requestContext/index.js";
import { RequestTenantLoader } from "@webiny/api-core/features/requestContext/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import type { Timer } from "@webiny/utils/features/Timer/abstraction.js";
import { TaskClaim } from "~/domain/TaskClaim.js";
import { CLAIMED_ELSEWHERE_STATUS } from "~/domain/BackgroundTasksLoop.js";
import { RandomProcessOwner } from "~/claim/RandomProcessOwner.js";
import { KeyValueTaskClaim } from "~/claim/KeyValueTaskClaim.js";
import { CLAIM_RENEW_EVERY_MS } from "~/claim/constants.js";
import { CLAIM_TTL_MS } from "~/claim/constants.js";
import { InProcessBackgroundTaskHandler } from "~/handlers/InProcessBackgroundTaskHandler.js";
import { ShutdownSignal } from "~/domain/ShutdownSignal.js";
import { HANDED_BACK_STATUS } from "~/domain/BackgroundTasksLoop.js";
import { ProcessShutdownSignal } from "~/shutdown/ProcessShutdownSignal.js";
import { createMemoryKeyValueStore } from "./helpers/createMemoryKeyValueStore.js";

/*
 * The runner is scripted: `runIteration` decides what one iteration does and answers. It gets the
 * timer the handler built, as a task would through `isCloseToTimeout()`.
 */
const runner = vi.hoisted(() => {
    return {
        runIteration: async (_timer: unknown): Promise<Record<string, unknown>> => {
            return { status: "done" };
        }
    };
});

vi.mock("@webiny/background-tasks/api/runner/index.js", () => {
    class TaskRunner {
        public constructor(
            _context: unknown,
            private readonly timer: unknown
        ) {}

        public run() {
            return runner.runIteration(this.timer);
        }
    }
    return { TaskRunner };
});

const target = { tenant: "root", taskId: "task-1" };

const event: IBackgroundTaskEvent = {
    webinyTaskId: "task-1",
    webinyTaskDefinitionId: "testDef",
    tenant: "root",
    delay: 0,
    endpoint: "in-process",
    executionName: "task-1",
    stateMachineId: ""
};

// One process's handler, and a second process's claim on the same store to compete with it.
const createHandler = () => {
    const { store } = createMemoryKeyValueStore();
    const logger = { warn: vi.fn(), error: vi.fn(), info: vi.fn() } as unknown as Logger.Interface;

    const container = new Container();
    container.registerInstance(GlobalKeyValueStore, store);
    container.registerInstance(RequestContainer, container);
    container.registerInstance(RawTenantId, { set: vi.fn() } as unknown as RawTenantId.Interface);
    container.registerInstance(RequestTenantLoader, {
        establish: async () => {}
    } as unknown as RequestTenantLoader.Interface);
    container.registerInstance(Logger, logger);
    container.register(RandomProcessOwner).inSingletonScope();
    container.register(KeyValueTaskClaim);
    container.register(ProcessShutdownSignal).inSingletonScope();
    container.register(InProcessBackgroundTaskHandler);

    const other = new Container();
    other.registerInstance(GlobalKeyValueStore, store);
    other.register(RandomProcessOwner).inSingletonScope();
    other.register(KeyValueTaskClaim);

    const handler = container.resolve(BackgroundTaskEventHandler);
    const next = async () => undefined;
    const run = () => handler.execute({ event } as any, next) as Promise<Record<string, unknown>>;

    return {
        run,
        claim: container.resolve(TaskClaim),
        otherClaim: other.resolve(TaskClaim),
        shutdown: container.resolve(ShutdownSignal)
    };
};

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe("InProcessBackgroundTaskHandler", () => {
    it("claims the task, runs it, and releases the claim when it finishes", async () => {
        runner.runIteration = async () => ({ status: "done" });
        const { run, otherClaim } = createHandler();

        const result = await run();

        expect(result.status).toBe("done");
        expect(await otherClaim.take(target, CLAIM_TTL_MS)).toBe(true);
    });

    // As long as a Lambda on AWS, so a task saves its progress about as often on both.
    it("gives one iteration 15 minutes, not the loop's 24 hours", async () => {
        let remaining = 0;
        runner.runIteration = async taskTimer => {
            remaining = (taskTimer as Timer.Interface).getRemainingMilliseconds();
            return { status: "done" };
        };
        const { run } = createHandler();

        await run();

        expect(remaining).toBeGreaterThan(899_000);
        expect(remaining).toBeLessThanOrEqual(900_000);
    });

    it("does not run a task another process holds", async () => {
        const iteration = vi.fn(async () => ({ status: "done" }));
        runner.runIteration = iteration;
        const { run, otherClaim } = createHandler();
        await otherClaim.take(target, CLAIM_TTL_MS);

        const result = await run();

        expect(result.status).toBe(CLAIMED_ELSEWHERE_STATUS);
        expect(iteration).not.toHaveBeenCalled();
    });

    it("keeps the claim for the next iteration, and through the wait before it", async () => {
        runner.runIteration = async () => ({ status: "continue", wait: 300, delay: -1 });
        const { run, otherClaim } = createHandler();

        await run();
        // Well past one TTL, but still inside the wait plus one TTL.
        vi.advanceTimersByTime(300_000 + CLAIM_TTL_MS - 1000);

        expect(await otherClaim.take(target, CLAIM_TTL_MS)).toBe(false);

        // Past the wait and one TTL, the owner is taken to be dead.
        vi.advanceTimersByTime(2000);
        expect(await otherClaim.take(target, CLAIM_TTL_MS)).toBe(true);
    });

    it("runs a later iteration under the claim it already holds", async () => {
        runner.runIteration = async () => ({ status: "continue", delay: -1 });
        const { run } = createHandler();

        await run();
        const second = await run();

        expect(second.status).toBe("continue");
    });

    it("keeps extending the claim through a long iteration", async () => {
        let finish: () => void = () => {};
        runner.runIteration = () => {
            return new Promise(resolve => {
                finish = () => resolve({ status: "done" });
            });
        };
        const { run, otherClaim } = createHandler();

        const running = run();
        await vi.advanceTimersByTimeAsync(CLAIM_TTL_MS * 3);

        expect(await otherClaim.take(target, CLAIM_TTL_MS)).toBe(false);
        finish();
        await running;
    });

    // The owner stalled past its TTL and another process took over: this one must step aside.
    it("asks the task to stop, and steps aside, when the claim is lost mid-iteration", async () => {
        let timer: Timer.Interface | undefined;
        let finish: () => void = () => {};
        runner.runIteration = taskTimer => {
            timer = taskTimer as Timer.Interface;
            return new Promise(resolve => {
                finish = () => resolve({ status: "continue", delay: -1 });
            });
        };
        const { run, claim, otherClaim } = createHandler();

        const running = run();
        await vi.advanceTimersByTimeAsync(0);
        await claim.release(target);
        await otherClaim.take(target, CLAIM_TTL_MS);
        await vi.advanceTimersByTimeAsync(CLAIM_RENEW_EVERY_MS);

        expect(timer?.getRemainingMilliseconds()).toBe(0);
        finish();
        const result = await running;
        expect(result.status).toBe(CLAIMED_ELSEWHERE_STATUS);
    });

    describe("when the process is stopping", () => {
        it("asks a running task to save and stop, and releases its claim", async () => {
            let timer: Timer.Interface | undefined;
            let finish: () => void = () => {};
            runner.runIteration = taskTimer => {
                timer = taskTimer as Timer.Interface;
                return new Promise(resolve => {
                    finish = () => resolve({ status: "continue", delay: -1 });
                });
            };
            const { run, otherClaim, shutdown } = createHandler();

            const running = run();
            await vi.advanceTimersByTimeAsync(0);
            shutdown.stop();

            expect(timer?.getRemainingMilliseconds()).toBe(0);
            finish();
            const result = await running;
            expect(result.status).toBe(HANDED_BACK_STATUS);
            // Released, so another process can take it at its next sweep.
            expect(await otherClaim.take(target, CLAIM_TTL_MS)).toBe(true);
        });

        // Releasing would let another process run the task before it is due.
        it("keeps the claim of a task that asked to wait", async () => {
            runner.runIteration = async () => ({ status: "continue", wait: 300, delay: -1 });
            const { run, otherClaim, shutdown } = createHandler();

            const running = run();
            shutdown.stop();
            const result = await running;

            expect(result.status).toBe(HANDED_BACK_STATUS);
            expect(await otherClaim.take(target, CLAIM_TTL_MS)).toBe(false);
        });

        it("releases the claim of a task that finished meanwhile, and keeps its result", async () => {
            runner.runIteration = async () => ({ status: "done" });
            const { run, otherClaim, shutdown } = createHandler();

            const running = run();
            shutdown.stop();
            const result = await running;

            expect(result.status).toBe("done");
            expect(await otherClaim.take(target, CLAIM_TTL_MS)).toBe(true);
        });

        it("does not start an iteration dispatched just before", async () => {
            const iteration = vi.fn(async () => ({ status: "done" }));
            runner.runIteration = iteration;
            const { run, otherClaim, shutdown } = createHandler();
            shutdown.stop();

            const result = await run();

            expect(result.status).toBe(HANDED_BACK_STATUS);
            expect(iteration).not.toHaveBeenCalled();
            expect(await otherClaim.take(target, CLAIM_TTL_MS)).toBe(true);
        });
    });
});
