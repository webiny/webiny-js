import { BugReportConfig } from "../config/abstractions.js";
import { TOOL_LABEL } from "../config/BugReportConfig.js";
import { EXTENSION_BY_MEDIA_TYPE } from "../screenshotMediaTypes.js";
import { parseRepository } from "./parseRepository.js";
import { GitHubIssueGateway as Abstraction } from "./abstractions.js";
import type { ICreateIssueInput } from "./abstractions.js";
import type { IFiledIssue } from "../../shared/types.js";
import type { IRepositoryRef } from "./parseRepository.js";
import type { IReportedScreenshot } from "../../shared/types.js";

const API_ROOT = "https://api.github.com";

/*
 * Node's fetch has no default timeout. Without this a stalled connection holds the function open to
 * its own limit while the stream sits on "Creating the issue..." with nothing more to say.
 */
const REQUEST_TIMEOUT_MS = 15000;

/*
 * Screenshots are committed to a branch of their own rather than to the default branch, so they
 * never show up in a diff, and the whole branch can be deleted once it gets large.
 */
const ASSETS_BRANCH = "bug-report-assets";

const TOOL_LABEL_COLOR = "1d76db";
const TOOL_LABEL_DESCRIPTION = "Filed from the admin app by the bug reporter";

/* Pasted images are not always PNG, and GitHub renders by extension. */
function buildScreenshotPath(mediaType: string): string {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const extension = EXTENSION_BY_MEDIA_TYPE[mediaType] ?? "png";
    // A report can attach several images inside the same millisecond, hence the suffix.
    const suffix = Math.random().toString(36).slice(2, 8);
    return `screenshots/${stamp}-${suffix}.${extension}`;
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

class GitHubIssueGatewayImpl implements Abstraction.Interface {
    constructor(private config: BugReportConfig.Interface) {}

    async uploadScreenshot(screenshot: IReportedScreenshot): Promise<string> {
        const repository = this.readRepository();
        await this.ensureAssetsBranch(repository);

        const path = buildScreenshotPath(screenshot.mediaType);
        const payload = {
            message: "chore: bug report screenshot",
            content: screenshot.base64,
            branch: ASSETS_BRANCH
        };

        const created = await this.request(
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

    async createIssue(input: ICreateIssueInput): Promise<IFiledIssue> {
        const repository = this.readRepository();
        await this.ensureToolLabel(repository);

        const payload = { title: input.title, body: input.body, labels: input.labels };

        const created = await this.request(`/repos/${repository.owner}/${repository.name}/issues`, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        const number = created.number;
        const url = created.html_url;

        if (typeof number !== "number" || typeof url !== "string") {
            throw new Error("GitHub returned an unexpected response when creating the issue.");
        }

        return { number, url };
    }

    /*
     * Created rather than relied upon, so it arrives with our colour and description instead of a
     * grey auto-created one, and so the first report against a fresh repository can't fail on it.
     * Only our own label: whatever BUG_REPORT_LABELS names is the configurer's business.
     */
    private async ensureToolLabel(repository: IRepositoryRef): Promise<void> {
        const base = `/repos/${repository.owner}/${repository.name}`;
        const exists = await this.exists(`${base}/labels/${encodeURIComponent(TOOL_LABEL)}`);
        if (exists) {
            return;
        }

        const payload = {
            name: TOOL_LABEL,
            color: TOOL_LABEL_COLOR,
            description: TOOL_LABEL_DESCRIPTION
        };

        /*
         * Check-then-create races: two first-ever reports against the same repository both see the
         * label missing and both POST. GitHub answers the loser with 422, which means the label now
         * exists — exactly what was wanted, so it is not a failure worth losing a report over.
         */
        const created = await fetch(`${API_ROOT}${base}/labels`, {
            method: "POST",
            body: JSON.stringify(payload),
            headers: this.buildHeaders(),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
        });

        if (!created.ok && created.status !== 422) {
            const message = await readErrorMessage(created);
            throw new Error(`GitHub responded ${created.status}: ${message}`);
        }
    }

    /*
     * The Contents API writes to an existing branch only, so the first report against a repository
     * has to create it. Branching off the default branch head keeps it a normal branch.
     */
    private async ensureAssetsBranch(repository: IRepositoryRef): Promise<void> {
        const base = `/repos/${repository.owner}/${repository.name}`;
        const exists = await this.exists(`${base}/git/ref/heads/${ASSETS_BRANCH}`);
        if (exists) {
            return;
        }

        const info = await this.request(base, { method: "GET" });
        const defaultBranch = info.default_branch;
        if (typeof defaultBranch !== "string") {
            throw new Error("Could not determine the repository's default branch.");
        }

        const head = await this.request(`${base}/git/ref/heads/${defaultBranch}`, {
            method: "GET"
        });

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

    private readRepository(): IRepositoryRef {
        return parseRepository(this.config.repository);
    }

    private async exists(path: string): Promise<boolean> {
        const response = await fetch(`${API_ROOT}${path}`, {
            headers: this.buildHeaders(),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
        });
        return response.ok;
    }

    private async request(path: string, init: RequestInit): Promise<Record<string, unknown>> {
        const response = await fetch(`${API_ROOT}${path}`, {
            ...init,
            headers: this.buildHeaders(),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
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
            Authorization: `Bearer ${this.config.token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json"
        };
    }
}

export const GitHubIssueGateway = Abstraction.createImplementation({
    implementation: GitHubIssueGatewayImpl,
    dependencies: [BugReportConfig]
});
