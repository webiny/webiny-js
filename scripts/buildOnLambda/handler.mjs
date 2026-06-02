import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { spawnSync } from "child_process";
import { createReadStream, existsSync, readdirSync, rmSync, statSync, writeFileSync } from "fs";
import { join } from "path";

const s3 = new S3Client({});
const TMP = "/tmp";
const BUSYBOX = join(process.env.LAMBDA_TASK_ROOT || "/var/task", "busybox");

async function downloadS3(bucket, key, localPath) {
  console.log(`  Downloading from s3://${bucket}/${key} ...`);
  const { Body } = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const bytes = await Body.transformToByteArray();
  writeFileSync(localPath, bytes);
  console.log(`  Downloaded ${(statSync(localPath).size / 1024 / 1024).toFixed(1)} MB.`);
}

async function uploadS3(bucket, key, localPath) {
  console.log(
    `  Uploading ${(statSync(localPath).size / 1024 / 1024).toFixed(1)} MB to s3://${bucket}/${key} ...`
  );
  await s3.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: createReadStream(localPath) })
  );
}

function run(cmd, args, opts) {
  console.log(`  Running: ${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, {
    stdio: "pipe",
    encoding: "utf-8",
    maxBuffer: 100 * 1024 * 1024,
    ...opts
  });
  const stdout = result.stdout?.trim();
  const stderr = result.stderr?.trim();
  if (stdout) {
    console.log(stdout);
  }
  if (stderr) {
    console.error(stderr);
  }
  if (result.status !== 0) {
    const detail =
      result.status === null
        ? `killed by signal ${result.signal}`
        : `exited with code ${result.status}`;
    const err = new Error(`Command failed (${detail}): ${cmd} ${args.join(" ")}`);
    err.stdout = stdout;
    err.stderr = stderr;
    throw err;
  }
  return { stdout, stderr };
}

function findYarnBinary(sourceDir) {
  const releasesDir = join(sourceDir, ".yarn", "releases");
  if (!existsSync(releasesDir)) {
    throw new Error("No yarn release found in project.");
  }
  const files = readdirSync(releasesDir).filter(f => f.startsWith("yarn-") && f.endsWith(".cjs"));
  if (files.length === 0) {
    throw new Error("No yarn .cjs release found.");
  }
  return join(releasesDir, files[0]);
}

function findDistDirs(sourceDir) {
  const packagesDir = join(sourceDir, "packages");
  if (!existsSync(packagesDir)) {
    return [];
  }
  const pkgs = readdirSync(packagesDir);
  const distDirs = [];
  for (const pkg of pkgs) {
    const distPath = join(packagesDir, pkg, "dist");
    if (existsSync(distPath)) {
      distDirs.push(join("packages", pkg, "dist"));
    }
  }
  return distDirs;
}

export const handler = async event => {
  const { bucket, sourceKey, outputKey, buildArgs } = event;
  const sourceDir = join(TMP, "source");
  const sourceTarball = join(TMP, "source.tar.gz");
  const outputTarball = join(TMP, "dist.tar.gz");

  try {
    /* 1. Download source tarball from S3. */
    console.log(`=== Step 1/5: Download source ===`);
    if (existsSync(sourceDir)) {
      rmSync(sourceDir, { recursive: true, force: true });
    }
    await downloadS3(bucket, sourceKey, sourceTarball);

    /* 2. Extract using busybox tar. */
    console.log(`=== Step 2/5: Extract source ===`);
    run(BUSYBOX, ["mkdir", "-p", sourceDir]);
    run(BUSYBOX, ["tar", "-xzf", sourceTarball, "-C", sourceDir]);
    rmSync(sourceTarball, { force: true });
    console.log("  Extraction complete.");

    /* 3. Yarn install (offline). */
    console.log(`=== Step 3/5: Yarn install ===`);
    const yarnBin = findYarnBinary(sourceDir);
    const yarnEnv = { ...process.env, HOME: "/tmp" };
    run("node", [yarnBin, "install"], { cwd: sourceDir, env: yarnEnv });

    /* 4. Yarn build. */
    console.log(`=== Step 4/5: Yarn build ===`);
    const buildEnv = { ...yarnEnv, CI: "true" };
    run("node", [yarnBin, "build", ...(buildArgs || [])], {
      cwd: sourceDir,
      env: buildEnv,
      timeout: 840 * 1000
    });

    /* 5. Collect dist and upload. */
    console.log(`=== Step 5/5: Package and upload ===`);
    const distDirs = findDistDirs(sourceDir);
    if (distDirs.length === 0) {
      throw new Error("No dist directories found after build.");
    }
    console.log(`  Found ${distDirs.length} dist directories.`);
    if (existsSync(outputTarball)) {
      rmSync(outputTarball);
    }
    run(BUSYBOX, ["tar", "-czf", outputTarball, ...distDirs], { cwd: sourceDir });

    await uploadS3(bucket, outputKey, outputTarball);

    console.log("=== Build complete ===");
    return { success: true, outputKey };
  } catch (err) {
    console.error("=== Build failed ===");
    console.error(err.message);
    if (err.stdout) {
      console.error("stdout:", err.stdout);
    }
    if (err.stderr) {
      console.error("stderr:", err.stderr);
    }
    return {
      success: false,
      error: err.message,
      stdout: err.stdout || "",
      stderr: err.stderr || ""
    };
  }
};
