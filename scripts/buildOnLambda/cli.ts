import { randomUUID } from "crypto";
import { spawnSync } from "child_process";
import { createReadStream, createWriteStream, rmSync, existsSync } from "fs";
import { pipeline } from "stream/promises";
import { hideBin } from "yargs/helpers";
import { Readable } from "stream";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import yargs from "yargs";

const BUCKET = process.env.BUILD_LAMBDA_BUCKET || "";
const FUNCTION_NAME = process.env.BUILD_LAMBDA_FN || "";

function getEnv(name) {
    const val = process.env[name];
    if (!val) {
        console.error(`Missing env var: ${name}. Run 'tsx scripts/buildOnLambda/infra.ts' first.`);
        process.exit(1);
    }
    return val;
}

async function uploadS3(client, bucket, key, localPath) {
    await client.send(
        new PutObjectCommand({ Bucket: bucket, Key: key, Body: createReadStream(localPath) })
    );
}

async function downloadS3(client, bucket, key, localPath) {
    const { Body } = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (Body instanceof Readable) {
        await pipeline(Body, createWriteStream(localPath));
    } else {
        const { writeFileSync } = await import("fs");
        const chunks = [];
        for await (const chunk of Body) {
            chunks.push(chunk);
        }
        writeFileSync(localPath, Buffer.concat(chunks));
    }
}

function run(cmd, args, opts) {
    const result = spawnSync(cmd, args, {
        stdio: "inherit",
        encoding: "utf-8",
        ...opts
    });
    if (result.status !== 0) {
        throw new Error(`Command failed with status ${result.status}: ${cmd} ${args.join(" ")}`);
    }
}

async function main() {
    const argv = yargs(hideBin(process.argv))
        .option("p", { type: "string", array: true, description: "Build specific package(s)" })
        .option("no-cache", { type: "boolean", description: "Skip build cache" })
        .parseSync();

    const bucket = getEnv("BUILD_LAMBDA_BUCKET");
    const fnName = getEnv("BUILD_LAMBDA_FN");

    const s3 = new S3Client({});
    const lambda = new LambdaClient({});

    const buildId = randomUUID().slice(0, 8);
    const sourceKey = `input/${buildId}.tar.gz`;
    const outputKey = `output/${buildId}.tar.gz`;

    /* 1. Create source tarball. */
    const sourceTarball = `/tmp/build-source-${buildId}.tar.gz`;
    if (existsSync(sourceTarball)) {
        rmSync(sourceTarball);
    }
    console.log("Creating source tarball...");
    run(
        "tar",
        [
            "-czf",
            sourceTarball,
            "--exclude=node_modules",
            "--exclude=dist",
            "--exclude=.git",
            "--exclude=*.tsbuildinfo",
            "--exclude=.webiny",
            "."
        ],
        {
            env: { ...process.env, COPYFILE_DISABLE: "1" }
        }
    );

    /* 2. Upload to S3. */
    console.log(`Uploading to s3://${bucket}/${sourceKey} ...`);
    await uploadS3(s3, bucket, sourceKey, sourceTarball);

    /* 3. Build args. */
    const buildArgs = [];
    if (argv.noCache) {
        buildArgs.push("--no-cache");
    }
    if (argv.p) {
        for (const pkg of argv.p) {
            buildArgs.push("-p", pkg);
        }
    }

    /* 4. Invoke Lambda. */
    console.log(`Invoking Lambda ${fnName}...`);
    const invokeStart = Date.now();
    const response = await lambda.send(
        new InvokeCommand({
            FunctionName: fnName,
            InvocationType: "RequestResponse",
            Payload: JSON.stringify({ bucket, sourceKey, outputKey, buildArgs })
        })
    );

    /* 5. Handle response. */
    const payload = JSON.parse(
        typeof response.Payload === "string"
            ? response.Payload
            : new TextDecoder().decode(response.Payload)
    );

    const elapsed = Math.round((Date.now() - invokeStart) / 1000);

    if (response.FunctionError || !payload.success) {
        console.error(`\nBuild failed after ${elapsed}s.`);
        if (payload.stderr) {
            console.error("\n--- stderr ---\n" + payload.stderr);
        }
        if (payload.stdout) {
            console.error("\n--- stdout ---\n" + payload.stdout);
        }
        process.exit(1);
    }

    console.log(`Lambda build completed in ${elapsed}s.`);

    /* 6. Download dist. */
    console.log(`Downloading dist from s3://${bucket}/${outputKey} ...`);
    const distTarball = `/tmp/build-output-${buildId}.tar.gz`;
    await downloadS3(s3, bucket, outputKey, distTarball);

    /* 7. Extract. */
    console.log("Extracting dist...");
    run("tar", ["-xzf", distTarball]);

    /* 8. Cleanup. */
    rmSync(sourceTarball, { force: true });
    rmSync(distTarball, { force: true });

    console.log("Build complete.");
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
