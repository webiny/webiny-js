/*
 * Shell snippets that keep a `/beta` run's PR comment and the release PR's body up to date.
 *
 * Both are written from bash rather than a Node script: the workflow file comes from `next`, but the
 * code it checks out is the release branch, which may predate any script added here.
 *
 * Neither snippet calls `exit`. They are pasted into steps that go on to do other things, including
 * the guard in front of the "latest" release, which must still fail after reporting why.
 */

/*
 * Fenced by these markers, the "Latest beta" section of a release PR body is replaced on every run
 * and the rest of the body is left alone. `v6_fullRelease` writes a placeholder between them when it
 * opens the PR.
 */
export const BETA_SECTION_START = "<!-- beta-release:start -->";
export const BETA_SECTION_END = "<!-- beta-release:end -->";

// Env every status step needs, on top of whatever variables its markdown uses.
export const statusEnv = {
    GH_TOKEN: "${{ secrets.GITHUB_TOKEN }}",
    REPO: "${{ github.repository }}",
    PR_NUMBER: "${{ github.event.issue.number }}",
    COMMENT_ID: "${{ needs.checkComment.outputs.comment-id }}",
    RUN_URL: "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
};

/*
 * Writes markdown to a file through an unquoted heredoc, so `${VAR}` expands. Backticks would be
 * command substitution in there, so each one is swapped for `${B}`, which expands to a literal
 * backtick and is not parsed again.
 */
const writeMarkdown = (file: string, lines: string[]) => [
    "B='`'",
    `cat > ${file} <<EOF`,
    ...lines.map(line => line.replace(/`/g, "${B}")),
    "EOF"
];

/*
 * Replaces the body of the comment the run posted when it started. There is none when the
 * `checkComment` job failed (e.g. the commenter lacks write access).
 */
export const replaceComment = (lines: string[]) =>
    [
        ...writeMarkdown("/tmp/beta-comment.md", lines),
        'if [ -n "$COMMENT_ID" ]; then',
        '  gh api -X PATCH "repos/$REPO/issues/comments/$COMMENT_ID" --field body=@/tmp/beta-comment.md > /dev/null',
        "else",
        '  echo "No status comment to update."',
        "fi"
    ].join("\n");

// Puts the section at the top of the PR body, dropping the previous one wherever it was.
export const replacePrBodySection = (lines: string[]) =>
    [
        ...writeMarkdown("/tmp/beta-section.md", [BETA_SECTION_START, ...lines, BETA_SECTION_END]),
        `gh api "repos/$REPO/pulls/$PR_NUMBER" --jq '.body // ""' > /tmp/pr-body.md`,
        `awk '/${BETA_SECTION_START}/{skip=1} !skip{print} /${BETA_SECTION_END}/{skip=0}' /tmp/pr-body.md \\`,
        "  | sed '/./,$!d' > /tmp/pr-body-rest.md",
        "{ cat /tmp/beta-section.md; echo; cat /tmp/pr-body-rest.md; } > /tmp/pr-body-new.md",
        'gh api -X PATCH "repos/$REPO/pulls/$PR_NUMBER" --field body=@/tmp/pr-body-new.md > /dev/null'
    ].join("\n");
