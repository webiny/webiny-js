import { BugReportSettings } from "../settings/abstractions.js";
import { GitHubGateway as Abstraction } from "./abstractions.js";
import type { ICreatedIssue } from "./abstractions.js";
import type { IIssueInput } from "./abstractions.js";

const API_ROOT = "https://api.github.com";

/*
 * Screenshots are committed to a branch of their own rather than to the default branch, so
 * they never show up in a diff, and the whole branch can be deleted when it gets large.
 */
const ASSETS_BRANCH = "bug-report-assets";

interface IRepositoryRef {
    owner: string;
    name: string;
}

function parseRepository(repository: string): IRepositoryRef {
    const [owner, name] = repository.split("/");
    if (!owner || !name) {
        throw new Error(`"${repository}" is not a valid repository. Use the "owner/name" form.`);
    }
    return { owner, name };
}

function readBase64Payload(dataUrl: string): string {
    const separator = dataUrl.indexOf(",");
    if (separator === -1) {
        throw new Error("The screenshot is not a valid data URL.");
    }
    return dataUrl.slice(separator + 1);
}

function buildScreenshotPath(): string {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `screenshots/${stamp}.png`;
}

async function readErrorMessage(response: Response): Promise<string> {
    try {
        const payload: Record<string, unknown> = await response.json();
        const message = payload.message;
        if (typeof message === "string") {
            return message;
        }
    } catch {
        return response.statusText;
    }
    return response.statusText;
}

class GitHubGatewayImpl implements Abstraction.Interface {
    constructor(private settings: BugReportSettings.Interface) {}

    async uploadScreenshot(dataUrl: string): Promise<string> {
        const repository = parseRepository(this.settings.values.repository);
        await this.ensureAssetsBranch(repository);

        const path = buildScreenshotPath();
        const payload = {
            message: `chore: bug report screenshot`,
            content: readBase64Payload(dataUrl),
            branch: ASSETS_BRANCH
        };

        const created: Record<string, unknown> = await this.request(
            `/repos/${repository.owner}/${repository.name}/contents/${path}`,
            { method: "PUT", body: JSON.stringify(payload) }
        );

        const content = created.content;
        if (content && typeof content === "object") {
            const downloadUrl = Reflect.get(content, "download_url");
            if (typeof downloadUrl === "string") {
                return downloadUrl;
            }
        }

        throw new Error("GitHub accepted the screenshot but returned no URL for it.");
    }

    async createIssue(input: IIssueInput): Promise<ICreatedIssue> {
        const repository = parseRepository(this.settings.values.repository);
        const payload = { title: input.title, body: input.body, labels: input.labels };

        const created: Record<string, unknown> = await this.request(
            `/repos/${repository.owner}/${repository.name}/issues`,
            { method: "POST", body: JSON.stringify(payload) }
        );

        const number = created.number;
        const url = created.html_url;

        if (typeof number !== "number" || typeof url !== "string") {
            throw new Error("GitHub returned an unexpected response when creating the issue.");
        }

        return { number, url };
    }

    /*
     * The Contents API writes to an existing branch only, so the first report of the day on
     * a fresh clone has to create it. Branching off the default branch head keeps it a
     * normal branch that anyone can check out.
     */
    private async ensureAssetsBranch(repository: IRepositoryRef): Promise<void> {
        const base = `/repos/${repository.owner}/${repository.name}`;
        const exists = await this.hasRef(`${base}/git/ref/heads/${ASSETS_BRANCH}`);
        if (exists) {
            return;
        }

        const info: Record<string, unknown> = await this.request(base, { method: "GET" });
        const defaultBranch = info.default_branch;
        if (typeof defaultBranch !== "string") {
            throw new Error("Could not determine the repository's default branch.");
        }

        const head: Record<string, unknown> = await this.request(
            `${base}/git/ref/heads/${defaultBranch}`,
            { method: "GET" }
        );

        const object = head.object;
        if (!object || typeof object !== "object") {
            throw new Error("Could not read the default branch head.");
        }

        const sha = Reflect.get(object, "sha");
        if (typeof sha !== "string") {
            throw new Error("Could not read the default branch head.");
        }

        const payload = { ref: `refs/heads/${ASSETS_BRANCH}`, sha };
        await this.request(`${base}/git/refs`, { method: "POST", body: JSON.stringify(payload) });
    }

    private async hasRef(path: string): Promise<boolean> {
        const response = await fetch(`${API_ROOT}${path}`, { headers: this.buildHeaders() });
        return response.ok;
    }

    private async request(path: string, init: RequestInit): Promise<Record<string, unknown>> {
        const response = await fetch(`${API_ROOT}${path}`, {
            ...init,
            headers: this.buildHeaders()
        });

        if (!response.ok) {
            const message = await readErrorMessage(response);
            throw new Error(`GitHub responded ${response.status}: ${message}`);
        }

        const payload: Record<string, unknown> = await response.json();
        return payload;
    }

    private buildHeaders(): Record<string, string> {
        return {
            Authorization: `Bearer ${this.settings.values.githubToken}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json"
        };
    }
}

export const GitHubGateway = Abstraction.createImplementation({
    implementation: GitHubGatewayImpl,
    dependencies: [BugReportSettings]
});
