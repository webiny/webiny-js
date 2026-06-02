import { randomUUID } from "crypto";
import { createWriteStream, existsSync, rmSync } from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import { hideBin } from "yargs/helpers";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import {
    EC2Client,
    DescribeInstancesCommand,
    RunInstancesCommand,
    CreateTagsCommand
} from "@aws-sdk/client-ec2";
import { SSMClient, SendCommandCommand, GetCommandInvocationCommand } from "@aws-sdk/client-ssm";
import yargs from "yargs";

const BUCKET = process.env.BUILD_EC2_BUCKET || "";
const LT_NAME = process.env.BUILD_EC2_LT || "";

function getEnv(name) {
    const val = process.env[name];
    if (!val) {
        console.error(`Missing env var: ${name}. Run 'tsx scripts/buildOnEc2/infra.ts' first.`);
        process.exit(1);
    }
    return val;
}

const BUILD_SCRIPT = `#!/bin/bash
set -e
BUILD_DIR="/opt/webiny-js"
CACHE_BUCKET="__CACHE_BUCKET__"
BUILD_ID="__BUILD_ID__"
BRANCH="__BRANCH__"

date > /tmp/last-build-activity

echo "=== Fetching latest ==="
cd "$BUILD_DIR"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "=== Restoring caches ==="
aws s3 cp "s3://$CACHE_BUCKET/cache/node_modules.tar.gz" /tmp/node_modules.tar.gz 2>/dev/null && \
    tar -xzf /tmp/node_modules.tar.gz -C "$BUILD_DIR" && \
    rm /tmp/node_modules.tar.gz && echo "  node_modules cache restored" || true

aws s3 cp "s3://$CACHE_BUCKET/cache/build-cache.tar.gz" /tmp/build-cache.tar.gz 2>/dev/null && \
    tar -xzf /tmp/build-cache.tar.gz -C "$BUILD_DIR" && \
    rm /tmp/build-cache.tar.gz && echo "  build cache restored" || true

echo "=== Yarn install ==="
HOME=/tmp node .yarn/releases/yarn-4.14.1.cjs install

echo "=== Yarn build ==="
HOME=/tmp node .yarn/releases/yarn-4.14.1.cjs build __BUILD_ARGS__

echo "=== Packaging dist ==="
tar -czf /tmp/dist.tar.gz packages/*/dist/ 2>/dev/null || true
aws s3 cp /tmp/dist.tar.gz "s3://$CACHE_BUCKET/output/$BUILD_ID/dist.tar.gz"
rm /tmp/dist.tar.gz

echo "=== Uploading caches ==="
tar -czf /tmp/node_modules.tar.gz node_modules 2>/dev/null && \
    aws s3 cp /tmp/node_modules.tar.gz "s3://$CACHE_BUCKET/cache/node_modules.tar.gz" && \
    rm /tmp/node_modules.tar.gz && echo "  node_modules cache updated" || true

tar -czf /tmp/build-cache.tar.gz .webiny/cached-packages 2>/dev/null && \
    aws s3 cp /tmp/build-cache.tar.gz "s3://$CACHE_BUCKET/cache/build-cache.tar.gz" && \
    rm /tmp/build-cache.tar.gz && echo "  build cache updated" || true

echo "=== Build complete ==="
date > /tmp/last-build-activity
`;

async function findOrLaunchInstance(ec2) {
    const existing = await ec2.send(
        new DescribeInstancesCommand({
            Filters: [
                { Name: "tag:wby-build", Values: ["true"] },
                { Name: "instance-state-name", Values: ["pending", "running"] }
            ]
        })
    );

    for (const res of existing.Reservations || []) {
        for (const inst of res.Instances || []) {
            const id = inst.InstanceId!;
            const state = inst.State?.Name;
            console.log(`Found existing instance: ${id} (${state})`);
            return id;
        }
    }

    console.log("Launching new spot instance...");
    const launched = await ec2.send(
        new RunInstancesCommand({
            LaunchTemplate: { LaunchTemplateName: LT_NAME },
            MinCount: 1,
            MaxCount: 1,
            TagSpecifications: [
                {
                    ResourceType: "instance",
                    Tags: [{ Key: "wby-build", Value: "true" }]
                }
            ]
        })
    );

    const id = launched.Instances![0].InstanceId!;
    console.log(`Launched: ${id}`);

    /* Wait for running. */
    console.log("Waiting for instance to be running...");
    let running = false;
    while (!running) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        const desc = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [id] }));
        const state = desc.Reservations?.[0]?.Instances?.[0]?.State?.Name;
        console.log(`  ${id}: ${state}`);
        running = state === "running";
    }

    /* Wait for user-data to complete (SSM agent must be online). */
    console.log("Waiting for SSM agent (bootstrap in progress)...");
    let ok = false;
    while (!ok) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        const desc = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [id] }));
        const inst = desc.Reservations?.[0]?.Instances?.[0];
        if (inst?.State?.Name === "terminated") {
            throw new Error("Instance terminated during bootstrap.");
        }
        /* Cloud-init finished? Check user-data output roughly. */
        /* For now, just wait a fixed time — user-data takes ~2 min. */
        const launchTime = inst?.LaunchTime;
        if (launchTime) {
            const elapsed = (Date.now() - launchTime.getTime()) / 1000;
            if (elapsed > 180) {
                ok = true;
            }
        }
        console.log(`  Still waiting...`);
    }

    return id;
}

async function waitForSsmCommand(ssm, commandId, instanceId) {
    let done = false;
    let status = "";
    while (!done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        const inv = await ssm.send(
            new GetCommandInvocationCommand({
                CommandId: commandId,
                InstanceId: instanceId
            })
        );
        status = inv.Status || "";
        if (inv.StandardOutputContent) {
            process.stdout.write(inv.StandardOutputContent);
        }
        if (inv.StandardErrorContent) {
            process.stderr.write(inv.StandardErrorContent);
        }
        if (["Success", "Failed", "Cancelled", "TimedOut"].includes(status)) {
            done = true;
        }
    }
    if (status !== "Success") {
        throw new Error(`SSM command failed: ${status}`);
    }
}

async function downloadDist(s3, bucket, buildId) {
    const key = `output/${buildId}/dist.tar.gz`;
    const distPath = `/tmp/build-ec2-dist-${buildId}.tar.gz`;
    console.log(`Downloading dist from s3://${bucket}/${key} ...`);
    try {
        const { Body } = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
        if (Body instanceof Readable) {
            await pipeline(Body, createWriteStream(distPath));
        } else {
            const { writeFileSync } = await import("fs");
            const chunks = [];
            for await (const chunk of Body) {
                chunks.push(chunk);
            }
            writeFileSync(distPath, Buffer.concat(chunks));
        }
        const { execSync } = await import("child_process");
        execSync(`tar -xzf ${distPath}`, { stdio: "inherit" });
        rmSync(distPath, { force: true });
        console.log("Dist extracted.");
    } catch {
        console.log("No dist output (build may have failed).");
    }
}

async function main() {
    const argv = yargs(hideBin(process.argv))
        .option("p", { type: "string", array: true, description: "Build specific package(s)" })
        .option("no-cache", { type: "boolean", description: "Skip build cache" })
        .option("branch", { type: "string", default: "next", description: "Git branch to build" })
        .parseSync();

    const bucket = getEnv("BUILD_EC2_BUCKET");
    getEnv("BUILD_EC2_LT");

    const ec2 = new EC2Client({});
    const ssm = new SSMClient({});
    const s3 = new S3Client({});

    const buildId = randomUUID().slice(0, 8);

    /* Build args for the script. */
    const buildArgs = [];
    if (argv.noCache) {
        buildArgs.push("--no-cache");
    }
    if (argv.p) {
        for (const pkg of argv.p) {
            buildArgs.push("-p", pkg);
        }
    }

    /* Launch or find instance. */
    const instanceId = await findOrLaunchInstance(ec2);

    /* Run build via SSM. */
    console.log(`Sending build command to ${instanceId}...`);
    const script = BUILD_SCRIPT.replace("__CACHE_BUCKET__", bucket)
        .replace("__BUILD_ID__", buildId)
        .replace("__BRANCH__", argv.branch)
        .replace("__BUILD_ARGS__", buildArgs.join(" "));

    const start = Date.now();
    const cmd = await ssm.send(
        new SendCommandCommand({
            InstanceIds: [instanceId],
            DocumentName: "AWS-RunShellScript",
            Parameters: { commands: [script] },
            TimeoutSeconds: 900
        })
    );

    console.log("Building (SSM command running)...");
    await waitForSsmCommand(ssm, cmd.Command!.CommandId!, instanceId);
    console.log(`Build completed in ${Math.round((Date.now() - start) / 1000)}s.`);

    /* Download results. */
    await downloadDist(s3, bucket, buildId);

    console.log("Done.");
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
