#!/usr/bin/env node

/**
 * [ MAINTAINERS ONLY ]
 * This tool checks if there are any commits that are in branch A that are not in branch B
 * and merges the branches. You will have to run `git push` yourself to confirm the merge.
 *
 * This tool is used to merge branches without creating PRs (as GitHub does) and avoid the annoying merge commit.
 */

const execa = require("execa");
const yargs = require("yargs");
const chalk = require("chalk");
const gitLogParser = require("git-log-parser");
const getStream = require("get-stream");

const { argv } = yargs.command("$0 <from> <into>", "merge branches").help();

function log(...args) {
    const [format, ...rest] = args;
    console.log(
        `${chalk.grey("[WGIT]:")} ${format.replace(/%[^%]/g, seq => chalk.magenta(seq))}`,
        ...rest
    );
}

async function getCommits(gitHead) {
    Object.assign(gitLogParser.fields, {
        hash: "H",
        message: "B",
        gitTags: "d",
        committerDate: { key: "ci", type: Date }
    });

    return (await getStream.array(
        gitLogParser.parse({ _: `${gitHead ? gitHead + ".." : ""}HEAD` })
    )).map(commit => {
        commit.message = commit.message.trim();
        commit.gitTags = commit.gitTags.trim();
        return commit;
    });
}

(async () => {
    const { from, into } = argv;

    log("Merging from %s into %s...", from, into);
    const options = { stdio: "inherit" };

    try {
        await execa.shell("git fetch", options);
        await execa.shell("git checkout " + into, options);
        await execa.shell("git pull", options);
        await execa.shell("git checkout " + from, options);

        // Count commits on the "from" branch starting from merge-base to HEAD
        const commits = await getCommits(into, from);
        if (commits.length) {
            log(`Found %s commit(s) that need to be merged:`, commits.length);
            commits.map(c => {
                log(`* ${c.subject} (%s)`, c.commit.short);
            });
            await execa.shell("git checkout " + into, options);
            await execa.shell("git merge " + from, options);
            log(
                "Merge is complete. You must run %s yourself after you have verified everything is in order.",
                "git push"
            );
        } else {
            log(
                "No new commits were found in branch %s that are not already in branch %s.",
                from,
                into
            );
        }
        log("Exiting.");
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
