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

/**
 * A step that checks the commenter has write access and reacts to the comment
 * with `eyes`. Replaces `xt0rted/slash-command-action@v2`.
 */
export const checkCommandStep = () => {
    return {
        name: "Check permission and react to comment",
        env: { GH_TOKEN: "${{ secrets.GITHUB_TOKEN }}" },
        run: [
            'PERMISSION=$(gh api "/repos/${{ github.repository }}/collaborators/${{ github.event.comment.user.login }}/permission" -q .permission)',
            'if [ "$PERMISSION" != "write" ] && [ "$PERMISSION" != "admin" ]; then',
            '  echo "::error::User ${{ github.event.comment.user.login }} does not have write permission (has: $PERMISSION)."',
            "  exit 1",
            "fi",
            'gh api --silent -X POST "/repos/${{ github.repository }}/issues/comments/${{ github.event.comment.id }}/reactions" -f content=eyes'
        ].join("\n")
    };
};
