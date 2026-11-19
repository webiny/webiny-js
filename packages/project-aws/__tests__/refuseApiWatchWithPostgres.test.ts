import { describe, it, expect } from "vitest";
import type { IProjectConfigModel } from "@webiny/project/abstractions/models/index.js";
import type { ApiBeforeWatch } from "@webiny/project/abstractions/index.js";
import type { GetProjectConfigService } from "@webiny/project/abstractions/index.js";
import type { ProjectSdkParamsService } from "@webiny/project/abstractions/index.js";
import { Postgres } from "@webiny/project-extensions-aws/extensions/Postgres.js";
import { RefuseApiWatchWithPostgresImpl } from "~/extensions/ProjectAws/RefuseApiWatchWithPostgres.js";

type ExtensionParams = Record<string, unknown>;

/* A project config holding the given extensions' params, keyed by extension component. */
const projectConfigWith = (extensions: Array<[unknown, ExtensionParams]>): IProjectConfigModel =>
    ({
        extensionsByType: (type: unknown) =>
            extensions.filter(([ext]) => ext === type).map(([, params]) => ({ params }))
    }) as unknown as IProjectConfigModel;

const watchApi = (
    extensions: Array<[unknown, ExtensionParams]>,
    params: Partial<ApiBeforeWatch.Params> = {}
) => {
    /* Called as watch calls every ApiBeforeWatch hook: with the watch params. */
    const hook: ApiBeforeWatch.Interface = new RefuseApiWatchWithPostgresImpl(
        {
            execute: async () => projectConfigWith(extensions)
        } as unknown as GetProjectConfigService.Interface,
        { get: () => ({ env: "dev" }) } as unknown as ProjectSdkParamsService.Interface
    );
    return Promise.resolve(hook.execute({ app: "api", ...params } as ApiBeforeWatch.Params));
};

/* GracefulError keeps the short reason as its cause and the "what to do" text as its message. */
const failure = async (promise: Promise<unknown>) => {
    try {
        await promise;
    } catch (error) {
        const graceful = error as Error & { cause?: Error };
        return { reason: graceful.cause?.message, message: graceful.message };
    }
    throw new Error("Expected watch to be refused, and it was let through.");
};

describe("watch api with <Infra.Postgres /> on AWS", () => {
    it("refuses, says the database is in private subnets, and says to deploy instead", async () => {
        const result = await failure(watchApi([[Postgres, {}]]));

        expect(result.reason).toBe("Cannot watch the API of a project that uses Postgres on AWS.");
        expect(result.message).toContain("private");
        expect(result.message).toContain("yarn webiny deploy api --env dev");
    });

    it("still refuses with --no-deployment-checks, because watch can't reach the database at all", async () => {
        const result = await failure(watchApi([[Postgres, {}]], { deploymentChecks: false }));

        expect(result.reason).toBe("Cannot watch the API of a project that uses Postgres on AWS.");
    });

    it("lets watch through without <Infra.Postgres />", async () => {
        await expect(watchApi([])).resolves.toBeUndefined();
    });
});
