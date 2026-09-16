import { describe, it, expect } from "vitest";
import { TaskRunner } from "~/api/runner";
import { createMockEvent } from "~tests/mocks";
import { createLiveContextFactory } from "~tests/live";
import { timerFactory } from "@webiny/utils/features/Timer/factory.js";
import { TaskEventValidation } from "~/api/runner/TaskEventValidation";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { Container } from "@webiny/di";

/**
 * `run` and every hook receive the definition being run. The point is decorators: one is registered
 * against the abstraction so it wraps every task, and without this it has nothing to branch on but
 * a hardcoded list of ids.
 */
describe("the definition in run params", () => {
    it("passes the definition to run", async () => {
        let seen: Record<string, any> | undefined;

        class TestTask implements TaskDefinition.Interface {
            id = "definitionInParams";
            title = "Definition In Params";
            maxIterations = 7;

            // Not a field the framework knows about. See the assertion below: it does NOT
            // currently survive, because the decorators are fixed pass-throughs.
            rateLimit = 10;

            async run({ controller, definition }: TaskDefinition.RunParams) {
                seen = definition as Record<string, any>;
                return controller.response.done("Done");
            }
        }

        const TestTaskDefinition = TaskDefinition.createImplementation({
            implementation: TestTask,
            dependencies: []
        });

        const contextFactory = createLiveContextFactory({
            plugins: [
                (container: Container) => {
                    container.register(TestTaskDefinition);
                }
            ]
        });

        const context = await contextFactory();
        const runner = new TaskRunner(context, timerFactory(), new TaskEventValidation());

        const task = await context.tasks.createTask({
            definitionId: "definitionInParams",
            input: {},
            name: "Test task"
        });

        await runner.run(
            createMockEvent({
                webinyTaskId: task.id,
                webinyTaskDefinitionId: "definitionInParams"
            })
        );

        expect(seen).toBeDefined();
        expect(seen!.id).toBe("definitionInParams");
        expect(seen!.title).toBe("Definition In Params");
        expect(seen!.maxIterations).toBe(7);

        // KNOWN GAP, pinned deliberately. RunnableTaskDecorator and SelfCleaningTaskDecorator
        // expose a fixed set of getters, so a field the framework does not know about is dropped
        // during decoration. If someone makes the decorators forward unknown properties, this
        // assertion fails and should become `toBe(10)` — that is the intended end state, because a
        // definition is the natural place to declare policy a decorator acts on.
        expect(seen!.rateLimit).toBeUndefined();
    });

    it("lets a task be told apart from another by its definition", async () => {
        const seenIds: string[] = [];

        const makeTask = (id: string) => {
            class TestTask implements TaskDefinition.Interface {
                id = id;
                title = id;

                async run({ controller, definition }: TaskDefinition.RunParams) {
                    seenIds.push(definition.id);
                    return controller.response.done("Done");
                }
            }

            return TaskDefinition.createImplementation({
                implementation: TestTask,
                dependencies: []
            });
        };

        const contextFactory = createLiveContextFactory({
            plugins: [
                (container: Container) => {
                    container.register(makeTask("taskAlpha"));
                    container.register(makeTask("taskBeta"));
                }
            ]
        });

        const context = await contextFactory();
        const runner = new TaskRunner(context, timerFactory(), new TaskEventValidation());

        for (const id of ["taskBeta", "taskAlpha"]) {
            const task = await context.tasks.createTask({
                definitionId: id,
                input: {},
                name: `Test ${id}`
            });

            await runner.run(
                createMockEvent({ webinyTaskId: task.id, webinyTaskDefinitionId: id })
            );
        }

        expect(seenIds).toEqual(["taskBeta", "taskAlpha"]);
    });
});
