import { randomBytes } from "crypto";
import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import {
    S3Client,
    CreateBucketCommand,
    HeadBucketCommand,
    PutBucketLifecycleConfigurationCommand
} from "@aws-sdk/client-s3";
import {
    IAMClient,
    AttachRolePolicyCommand,
    CreateRoleCommand,
    GetRoleCommand,
    PutRolePolicyCommand
} from "@aws-sdk/client-iam";
import {
    CreateFunctionCommand,
    GetFunctionCommand,
    LambdaClient,
    ResourceNotFoundException,
    UpdateFunctionCodeCommand
} from "@aws-sdk/client-lambda";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";

const BUCKET_PREFIX = "wby-build-lambda";
const FUNCTION_NAME = "wby-build-lambda";
const ROLE_NAME = "wby-build-lambda-role";

function runCmd(cmd) {
    return execSync(cmd, { encoding: "utf-8", stdio: "pipe" }).trim();
}

async function main() {
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
    const sts = new STSClient({ region });
    const { Account } = await sts.send(new GetCallerIdentityCommand({}));
    console.log(`Account: ${Account}\nRegion:  ${region}`);

    const s3 = new S3Client({ region });
    const iam = new IAMClient({ region });
    const lambda = new LambdaClient({ region });

    /* 1. S3 bucket. */
    const bucketSuffix = randomBytes(6).toString("hex");
    const bucketName = `${BUCKET_PREFIX}-${bucketSuffix}`;
    console.log(`\n[1/3] S3 bucket: ${bucketName}`);
    try {
        await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
        console.log("  Bucket already exists.");
    } catch {
        await s3.send(
            new CreateBucketCommand({
                Bucket: bucketName,
                ...(region !== "us-east-1"
                    ? { CreateBucketConfiguration: { LocationConstraint: region } }
                    : {})
            })
        );
        console.log("  Created.");
    }

    await s3.send(
        new PutBucketLifecycleConfigurationCommand({
            Bucket: bucketName,
            LifecycleConfiguration: {
                Rules: [
                    {
                        Id: "expire-artifacts",
                        Status: "Enabled",
                        Expiration: { Days: 7 },
                        Filter: { Prefix: "" }
                    }
                ]
            }
        })
    );
    console.log("  Lifecycle: auto-delete after 7 days.");

    /* 2. IAM role. */
    const roleArn = `arn:aws:iam::${Account}:role/${ROLE_NAME}`;
    console.log(`\n[2/3] IAM role: ${ROLE_NAME}`);
    let roleExists = false;
    try {
        await iam.send(new GetRoleCommand({ RoleName: ROLE_NAME }));
        roleExists = true;
        console.log("  Role already exists.");
    } catch {
        /* Does not exist. */
    }

    if (!roleExists) {
        await iam.send(
            new CreateRoleCommand({
                RoleName: ROLE_NAME,
                AssumeRolePolicyDocument: JSON.stringify({
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Effect: "Allow",
                            Principal: { Service: "lambda.amazonaws.com" },
                            Action: "sts:AssumeRole"
                        }
                    ]
                })
            })
        );
        console.log("  Created. Waiting for propagation (10s)...");
        await new Promise(resolve => setTimeout(resolve, 10000));
    }

    try {
        await iam.send(
            new AttachRolePolicyCommand({
                RoleName: ROLE_NAME,
                PolicyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
            })
        );
    } catch {
        /* Already attached. */
    }

    try {
        await iam.send(
            new PutRolePolicyCommand({
                RoleName: ROLE_NAME,
                PolicyName: "s3-access",
                PolicyDocument: JSON.stringify({
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Effect: "Allow",
                            Action: ["s3:GetObject", "s3:PutObject"],
                            Resource: `arn:aws:s3:::${bucketName}/*`
                        }
                    ]
                })
            })
        );
    } catch {
        /* Already exists. */
    }
    console.log("  Policies attached.");

    /* 3. Lambda function. */
    console.log(`\n[3/3] Lambda: ${FUNCTION_NAME}`);

    /* Download static busybox for arm64 (from Alpine APK). */
    const busyboxPath = "/tmp/busybox";
    if (!existsSync(busyboxPath)) {
        const apkUrl =
            "https://dl-cdn.alpinelinux.org/alpine/latest-stable/main/aarch64/busybox-static-1.37.0-r30.apk";
        const apkPath = "/tmp/busybox.apk";
        console.log("  Downloading busybox-static...");
        runCmd(`curl -sL -o ${apkPath} ${apkUrl}`);
        runCmd(`tar -xzf ${apkPath} -C /tmp bin/busybox.static`);
        runCmd(`mv /tmp/bin/busybox.static ${busyboxPath}`);
        runCmd(`chmod +x ${busyboxPath}`);
        runCmd(`rm -f ${apkPath} /tmp/bin/busybox.static`);
        console.log("  Busybox ready.");
    }

    const handlerPath = join(process.cwd(), "scripts", "buildOnLambda", "handler.mjs");
    const zipPath = "/tmp/handler.zip";
    runCmd(`zip -j ${zipPath} ${handlerPath} ${busyboxPath}`);
    const zipBuffer = readFileSync(zipPath);

    let fnExists = false;
    try {
        await lambda.send(new GetFunctionCommand({ FunctionName: FUNCTION_NAME }));
        fnExists = true;
        console.log("  Function exists. Updating code...");
        await lambda.send(
            new UpdateFunctionCodeCommand({ FunctionName: FUNCTION_NAME, ZipFile: zipBuffer })
        );
        console.log("  Code updated.");
    } catch (err) {
        const isNotFound = err instanceof ResourceNotFoundException;
        if (!isNotFound) {
            throw err;
        }
    }

    if (!fnExists) {
        await lambda.send(
            new CreateFunctionCommand({
                FunctionName: FUNCTION_NAME,
                Runtime: "nodejs24.x",
                Role: roleArn,
                Handler: "handler.handler",
                Code: { ZipFile: zipBuffer },
                Timeout: 900,
                MemorySize: 10240,
                EphemeralStorage: { Size: 10240 },
                Architectures: ["arm64"],
                Environment: {
                    Variables: {
                        HOME: "/tmp",
                        NODE_OPTIONS: "--max-old-space-size=9216"
                    }
                }
            })
        );
        console.log("  Created (Node.js 24, 10 GB, 15 min timeout).");
    }

    /* 4. Persist env vars to .env. */
    const envFile = join(process.cwd(), ".env");
    const envBlock = [
        "",
        "# Remote build on AWS Lambda.",
        `BUILD_LAMBDA_BUCKET=${bucketName}`,
        `BUILD_LAMBDA_FN=${FUNCTION_NAME}`
    ].join("\n");

    if (existsSync(envFile)) {
        const existing = readFileSync(envFile, "utf-8");
        if (!existing.includes("BUILD_LAMBDA_BUCKET")) {
            writeFileSync(envFile, existing + envBlock + "\n");
            console.log(`\nAppended vars to ${envFile}.`);
        }
    } else {
        writeFileSync(envFile, envBlock.trim() + "\n");
        console.log(`\nCreated ${envFile}.`);
    }

    console.log(`\nDone. Source the env vars or restart your shell:`);
    console.log(`  export BUILD_LAMBDA_BUCKET=${bucketName}`);
    console.log(`  export BUILD_LAMBDA_FN=${FUNCTION_NAME}`);
    console.log(`\nThen run: yarn build:lambda [-p <pkg>]`);
}

main().catch(err => {
    console.error("Deploy failed:", err);
    process.exit(1);
});
