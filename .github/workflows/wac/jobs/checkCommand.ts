// Helpers that replace the abandoned `xt0rted/slash-command-action` (Node 16/20,
// deprecated). We reproduce its behaviour with runner-native `gh` CLI steps, so
// there's no third-party JS action and no Node runtime to get deprecated.
//
// Behaviour reproduced:
//  - Only run on `issue_comment` events whose body starts with the `/<command>`.
//    This is enforced via the job-level `if` (see `commandTriggeredIf`), so that
//    non-matching comments skip the job (and every `needs` job downstream).
//  - Require the commenter to have `write` (or `admin`) permission.
//  - Add an `eyes` reaction to the triggering comment.
//
// Added on top: refuse a PR whose head branch lives in a fork, unless `allowForks` is set.

/**
 * Job-level `if` expression that gates a command job on a pull-request comment
 * whose command token is exactly `/<command>`. Matches either the bare command
 * (`/e2e`) or the command followed by a space and arguments (`/e2e foo`), but
 * NOT a longer word that merely starts with it (`/e2eanything`).
 */
export const commandTriggeredIf = (command: string): string => {
    const body = "github.event.comment.body";
    return `\${{ github.event.issue.pull_request && (${body} == '/${command}' || startsWith(${body}, '/${command} ')) }}`;
};

interface CheckCommandStepParams {
    // The command, without the leading slash, for the message posted when a fork is refused.
    command: string;
    /*
     * Run on a PR whose head repository is not this one. Off by default: a comment-triggered
     * workflow runs with the repository's secrets, and the jobs check out and build the PR's
     * code, so a fork could read those secrets from its install or build scripts. A PR's head
     * repository can't change after it is opened, so checking it here also covers commits
     * pushed after the comment. A deleted fork has no head repository and is refused as well.
     */
    allowForks?: boolean;
}

/**
 * A step that checks the commenter has write access and reacts to the comment
 * with `eyes`. Replaces `xt0rted/slash-command-action@v2`.
 */
export const checkCommandStep = ({ command, allowForks = false }: CheckCommandStepParams) => {
    const permissionCheck = [
        'PERMISSION=$(gh api "/repos/${{ github.repository }}/collaborators/${{ github.event.comment.user.login }}/permission" -q .permission)',
        'if [ "$PERMISSION" != "write" ] && [ "$PERMISSION" != "admin" ]; then',
        '  echo "::error::User ${{ github.event.comment.user.login }} does not have write permission (has: $PERMISSION)."',
        "  exit 1",
        "fi"
    ];
    const forkCheck = [
        'HEAD_REPO=$(gh api "/repos/${{ github.repository }}/pulls/${{ github.event.issue.number }}" -q ".head.repo.full_name // empty")',
        'if [ "$HEAD_REPO" != "${{ github.repository }}" ]; then',
        `  echo "::error::/${command} does not run on pull requests from forks (head repository: \${HEAD_REPO:-deleted})."`,
        `  gh api --silent -X POST "/repos/\${{ github.repository }}/issues/\${{ github.event.issue.number }}/comments" -f body="/${command} does not run on pull requests from forks."`,
        "  exit 1",
        "fi"
    ];
    const run = [...permissionCheck];
    if (!allowForks) {
        run.push(...forkCheck);
    }
    run.push(
        'gh api --silent -X POST "/repos/${{ github.repository }}/issues/comments/${{ github.event.comment.id }}/reactions" -f content=eyes'
    );

    return {
        name: "Check permission and react to comment",
        env: { GH_TOKEN: "${{ secrets.GITHUB_TOKEN }}" },
        run: run.join("\n")
    };
};
