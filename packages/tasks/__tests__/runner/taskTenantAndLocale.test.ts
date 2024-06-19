import { createMockEvent } from "~tests/mocks";
import { createLiveContextFactory } from "~tests/live";
import { createTaskDefinition } from "~/task";
import { useTaskHandler } from "~tests/helpers/useTaskHandler";

const taskDefinition = createTaskDefinition({
    id: "taskRunnerTask",
    title: "Task Runner Task",
    maxIterations: 2,
    run: async ({ response, context }) => {
        return response.done("Task is done!", {
            tenant: context.tenancy.getCurrentTenant().id,
            locale: context.cms.getLocale().code,
            defaultLocale: context.i18n.getCurrentLocale("default")!.code,
            contentLocale: context.i18n.getCurrentLocale("content")!.code
        });
    }
});

const defaults = {
    tenant: "aCustomTenantId",
    locale: "de-DE"
};

describe("task tenant and locale", () => {
    it("should properly set the tenant and locale", async () => {
        const contextFactory = createLiveContextFactory({
            plugins: [taskDefinition]
        });

        const context = await contextFactory({
            headers: {
                ["x-tenant"]: defaults.tenant,
                ["x-webiny-cms-endpoint"]: "manage",
                ["x-webiny-cms-locale"]: defaults.locale,
                ["x-i18n-locale"]: defaults.locale,
                ["accept-language"]: defaults.locale
            }
        });

        const task = await context.tasks.createTask({
            definitionId: taskDefinition.id,
            input: {},
            name: "My task name"
        });

        const { handle } = useTaskHandler({
            plugins: [taskDefinition]
        });

        const result = await handle(
            createMockEvent({
                webinyTaskId: task.id,
                webinyTaskDefinitionId: taskDefinition.id,
                tenant: defaults.tenant,
                locale: defaults.locale
            })
        );

        expect(result).toEqual({
            status: "done",
            webinyTaskId: task.id,
            webinyTaskDefinitionId: taskDefinition.id,
            tenant: "aCustomTenantId",
            locale: "de-DE",
            message: "Task is done!",
            output: {
                tenant: "aCustomTenantId",
                locale: "de-DE",
                defaultLocale: "de-DE",
                contentLocale: "de-DE"
            }
        });
    });
});
