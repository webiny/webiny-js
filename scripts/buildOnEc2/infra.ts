import { randomBytes } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import {
    EC2Client,
    CreateLaunchTemplateCommand,
    DescribeLaunchTemplatesCommand,
    DescribeImagesCommand,
    AuthorizeSecurityGroupIngressCommand,
    CreateSecurityGroupCommand,
    DescribeSecurityGroupsCommand
} from "@aws-sdk/client-ec2";
import {
    IAMClient,
    AddRoleToInstanceProfileCommand,
    AttachRolePolicyCommand,
    CreateInstanceProfileCommand,
    CreateRoleCommand,
    GetInstanceProfileCommand,
    GetRoleCommand,
    PutRolePolicyCommand
} from "@aws-sdk/client-iam";
import {
    S3Client,
    CreateBucketCommand,
    HeadBucketCommand,
    PutBucketLifecycleConfigurationCommand
} from "@aws-sdk/client-s3";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";

const BUCKET_PREFIX = "wby-build";
const ROLE_NAME = "wby-build-ec2-role";
const PROFILE_NAME = "wby-build-ec2-profile";
const SG_NAME = "wby-build-ec2-sg";
const LT_NAME = "wby-build-ec2";

async function main() {
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

    const sts = new STSClient({ region });
    const { Account } = await sts.send(new GetCallerIdentityCommand({}));
    console.log(`Account: ${Account}\nRegion:  ${region}`);

    const ec2 = new EC2Client({ region });
    const iam = new IAMClient({ region });
    const s3 = new S3Client({ region });

    /* 1. S3 bucket. */
    const bucketSuffix = randomBytes(6).toString("hex");
    const bucketName = `${BUCKET_PREFIX}-${bucketSuffix}`;
    console.log(`\n[1/4] S3 bucket: ${bucketName}`);
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
    console.log("  Lifecycle: 7-day expiration.");

    /* 2. IAM role + instance profile. */
    console.log(`\n[2/4] IAM: ${ROLE_NAME}`);
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
                            Principal: { Service: "ec2.amazonaws.com" },
                            Action: "sts:AssumeRole"
                        }
                    ]
                })
            })
        );
        console.log("  Role created. Waiting 10s...");
        await new Promise(resolve => setTimeout(resolve, 10000));
    }
    try {
        await iam.send(
            new AttachRolePolicyCommand({
                RoleName: ROLE_NAME,
                PolicyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
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
                            Action: ["s3:GetObject", "s3:PutObject", "s3:ListBucket"],
                            Resource: [`arn:aws:s3:::${bucketName}`, `arn:aws:s3:::${bucketName}/*`]
                        }
                    ]
                })
            })
        );
    } catch {
        /* Already exists. */
    }
    try {
        await iam.send(
            new PutRolePolicyCommand({
                RoleName: ROLE_NAME,
                PolicyName: "self-terminate",
                PolicyDocument: JSON.stringify({
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Effect: "Allow",
                            Action: ["ec2:TerminateInstances"],
                            Resource: "*"
                        }
                    ]
                })
            })
        );
    } catch {
        /* Already exists. */
    }

    console.log("  Policies attached.");

    let profileExists = false;
    try {
        await iam.send(new GetInstanceProfileCommand({ InstanceProfileName: PROFILE_NAME }));
        profileExists = true;
        console.log("  Instance profile already exists.");
    } catch {
        /* Does not exist. */
    }
    if (!profileExists) {
        await iam.send(
            new CreateInstanceProfileCommand({ InstanceProfileName: PROFILE_NAME })
        );
        console.log("  Instance profile created.");
        await new Promise(resolve => setTimeout(resolve, 5000));
        await iam.send(
            new AddRoleToInstanceProfileCommand({
                InstanceProfileName: PROFILE_NAME,
                RoleName: ROLE_NAME
            })
        );
    }
    console.log("  Profile ready.");

    /* 3. Security group. */
    console.log(`\n[3/4] Security group: ${SG_NAME}`);
    let sgId = "";
    try {
        const sgs = await ec2.send(
            new DescribeSecurityGroupsCommand({
                Filters: [{ Name: "group-name", Values: [SG_NAME] }]
            })
        );
        if (sgs.SecurityGroups?.length) {
            sgId = sgs.SecurityGroups[0].GroupId!;
            console.log(`  Already exists: ${sgId}`);
        }
    } catch {
        /* Does not exist. */
    }
    if (!sgId) {
        const sg = await ec2.send(
            new CreateSecurityGroupCommand({
                GroupName: SG_NAME,
                Description: "Remote build EC2 instance"
            })
        );
        sgId = sg.GroupId!;
        console.log(`  Created: ${sgId}`);
    }

    /* 4. Launch template. */
    console.log(`\n[4/4] Launch template: ${LT_NAME}`);

    /* Get latest AL2023 ARM64 AMI. */
    const images = await ec2.send(
        new DescribeImagesCommand({
            Owners: ["amazon"],
            Filters: [
                { Name: "name", Values: ["al2023-ami-2023*-kernel-6.1-arm64"] },
                { Name: "state", Values: ["available"] }
            ]
        })
    );
    const amiId = images.Images?.sort((a, b) =>
        (b.CreationDate || "").localeCompare(a.CreationDate || "")
    )[0]?.ImageId;
    if (!amiId) {
        throw new Error("Could not find AL2023 ARM64 AMI.");
    }
    console.log(`  AMI: ${amiId}`);

    /* Read and template user-data. */
    const userDataPath = join(process.cwd(), "scripts", "buildOnEc2", "user-data.sh");
    const userDataRaw = readFileSync(userDataPath, "utf-8").replace("__CACHE_BUCKET__", bucketName);

    let ltExists = false;
    try {
        await ec2.send(
            new DescribeLaunchTemplatesCommand({
                LaunchTemplateNames: [LT_NAME]
            })
        );
        ltExists = true;
        console.log("  Launch template already exists (manual update needed).");
    } catch {
        /* Does not exist. */
    }
    if (!ltExists) {
        await ec2.send(
            new CreateLaunchTemplateCommand({
                LaunchTemplateName: LT_NAME,
                LaunchTemplateData: {
                    ImageId: amiId,
                    InstanceType: "c7g.2xlarge",
                    IamInstanceProfile: { Name: PROFILE_NAME },
                    SecurityGroupIds: [sgId],
                    UserData: Buffer.from(userDataRaw).toString("base64"),
                    BlockDeviceMappings: [
                        {
                            DeviceName: "/dev/xvda",
                            Ebs: { VolumeSize: 50, VolumeType: "gp3" }
                        }
                    ],
                    MetadataOptions: { HttpTokens: "required" }
                }
            })
        );
        console.log("  Created (c7g.2xlarge, 8 vCPU, 16 GB, 50 GB gp3, spot).");
    }

    /* Persist env. */
    const envFile = join(process.cwd(), ".env");
    const envBlock = [
        "",
        "# Remote build on AWS EC2.",
        `BUILD_EC2_BUCKET=${bucketName}`,
        `BUILD_EC2_LT=${LT_NAME}`,
        `BUILD_EC2_SG=${SG_NAME}`
    ].join("\n");
    if (existsSync(envFile)) {
        const existing = readFileSync(envFile, "utf-8");
        if (!existing.includes("BUILD_EC2_BUCKET")) {
            writeFileSync(envFile, existing + envBlock + "\n");
            console.log(`\nAppended vars to ${envFile}.`);
        }
    } else {
        writeFileSync(envFile, envBlock.trim() + "\n");
        console.log(`\nCreated ${envFile}.`);
    }

    console.log(`\nDone. Export the env vars and run:`);
    console.log(`  yarn build:ec2`);
}

main().catch(err => {
    console.error("Deploy failed:", err);
    process.exit(1);
});
