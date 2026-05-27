# Update PR Body

Use this when the user asks you to update a PR body on GitHub.

## Steps

1. Get commits on the current branch not on the remote default branch:

   ```bash
   git log --oneline origin/<default-branch>..HEAD
   ```

2. Get PR number and repo:

   ```bash
   gh pr view --json number,headRefName,baseRefName,title
   gh repo view --json owner,name | jq -r '"\(.owner.login)/\(.name)"'
   ```

3. Get the full diff with `git diff origin/<default-branch>...HEAD`.

4. Generate the PR body with this structure and write it to a temp file:

   ```
   ### What changed

   A short paragraph describing what changed from the user's perspective. Focus on behavior, not implementation details.

   ### Changelog

   **Title line:** A short, human-readable title (no code formatting, no PR number).

   **Body:** One or two plain-English sentences. Describe what was broken or missing, and what was fixed or added. No technical jargon, no file names, no method names. Written for end users, not developers.

   ### Screenshots

   ### Squash Merge Commit

   ```

   feat(scope): message (#PR_NUMBER)

   ```

   Pick the type that best fits the change (`feat`, `fix`, `chore`, `refactor`, `docs`, etc.). Append the PR number in parentheses at the end. Keep each message under 72 characters (excluding the PR number suffix). Format as a plain code block.
   ```

5. Update the PR:
   ```bash
   cat > /tmp/pr-body.md << 'EOF'
   <generated body>
   EOF
   gh api repos/{owner}/{repo}/pulls/{number} --method PATCH \
     --field title="<generated title>" \
     --field body=@/tmp/pr-body.md \
     --jq '.html_url'
   ```
