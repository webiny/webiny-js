/*
 * Run by the `/e2e` workflow (pullRequestsCommandE2e.wac.ts), with plain `node`, from the checkout
 * of the workflow's own branch: reads the comment from `COMMENT_BODY` and writes the step outputs
 *
 * - `tags`: the area tags to pass to `--tag`, comma-separated; empty for a full run.
 * - `comment-line`: the line the status comment gets, naming the areas or the error.
 *
 * Exits 1 when the comment names something that is not an area, which stops the run before any
 * build starts.
 */
import { appendFileSync } from "node:fs";
import { AREAS } from "../../../../e2e/areas.ts";
import { parseE2eCommand } from "./e2eAreasCommand.ts";

const command = parseE2eCommand(process.env.COMMENT_BODY || "", AREAS);

const outputs: string[] = [];
if (command.ok) {
    outputs.push(`tags=${command.tags.join(",")}`, `comment-line=Areas: ${command.label}`);
    console.log(`Areas: ${command.label}`);
} else {
    outputs.push("tags=", `comment-line=❌ ${command.message}`);
    // The message holds no raw comment text, so it cannot carry a workflow command.
    console.log(`::error::${command.message}`);
}

const outputFile = process.env.GITHUB_OUTPUT;
if (outputFile) {
    appendFileSync(outputFile, outputs.map(output => `${output}\n`).join(""));
}

if (!command.ok) {
    process.exit(1);
}
