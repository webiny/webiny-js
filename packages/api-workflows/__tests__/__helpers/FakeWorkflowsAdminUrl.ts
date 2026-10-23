import { WorkflowsAdminUrlService } from "~/features/notifications/WorkflowsAdminUrlService/index.js";

/**
 * The admin host a test link is built on, without service discovery. `url: null` is "no host",
 * `mode: "throw"` makes `get` throw (the link service must turn that into no link), `calls` counts
 * the lookups. Register with `container.registerInstance(WorkflowsAdminUrlService, fake)`.
 */
export class FakeWorkflowsAdminUrl implements WorkflowsAdminUrlService.Interface {
    public url: string | null = "https://admin.example.com";
    public mode: "ok" | "throw" = "ok";
    public calls = 0;

    public async get(): Promise<string | null> {
        this.calls += 1;
        if (this.mode === "throw") {
            throw new Error("Service discovery is not available.");
        }
        return this.url;
    }
}
