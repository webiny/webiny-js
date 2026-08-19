import { createWorkflow } from "github-actions-wac";
import { createJob } from "./createJob.js";
import { checkCommandStep, commandTriggeredIf } from "./checkCommand.js";

interface CreateSlashCommandWorkflowParams {
    // The slash command that triggers the workflow, without the leading slash (e.g. "e2e").
    command: string;
    // Workflow display name.
    name: string;
    // Body of the initial comment posted on the PR when the command is triggered.
    comment: string;
    // When `true`, the `checkComment` job exposes the created comment's id as its
    // `comment-id` output (so later jobs can update that same comment).
    captureCommentId?: boolean;
    // Extra `createWorkflow` properties merged into the workflow (e.g. `env`, `concurrency`).
    workflow?: Record<string, any>;
    // Jobs that run after `checkComment` (which is prepended automatically).
    jobs: Record<string, any>;
}

/**
 * Builds a workflow triggered by a `/<command>` PR comment. It wires up the
 * standard `checkComment` gate job (permission check + eyes reaction via
 * `checkCommandStep`, exact-token `if` via `commandTriggeredIf`, and an initial
 * status comment), then appends the caller's `jobs`.
 */
export const createSlashCommandWorkflow = (params: CreateSlashCommandWorkflowParams) => {
    const { command, name, comment, captureCommentId, workflow = {}, jobs } = params;

    const checkComment = createJob({
        name: `Check comment for /${command}`,
        if: commandTriggeredIf(command),
        checkout: false,
        // The gate step reacts to the comment and create-or-update-comment posts a status
        // comment, both via the default GITHUB_TOKEN - so this job needs write access to the
        // PR/issue. Merged on top of createJob's baseline permissions.
        permissions: {
            "pull-requests": "write",
            issues: "write"
        },
        ...(captureCommentId
            ? { outputs: { "comment-id": "${{ steps.create-comment.outputs.comment-id }}" } }
            : {}),
        steps: [
            checkCommandStep(),
            {
                name: "Create comment",
                id: "create-comment",
                uses: "peter-evans/create-or-update-comment@v5",
                with: {
                    "issue-number": "${{ github.event.issue.number }}",
                    body: comment
                }
            }
        ]
    });

    return createWorkflow({
        name,
        on: "issue_comment",
        ...workflow,
        jobs: {
            checkComment,
            ...jobs
        }
    });
};
