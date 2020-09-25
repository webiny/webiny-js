import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import vpc from "./vpc";
import defaultLambdaRole from "./defaultLambdaRole";

class DocumentDb {
    databaseProxy: aws.lambda.Function;
    documentDbCluster: aws.docdb.Cluster;
    constructor() {
        const subnetGroup = new aws.docdb.SubnetGroup("doc-db-subnet-group", {
            subnetIds: vpc.subnets.private.map(subNet => subNet.id)
        });

        const cluster = new aws.docdb.Cluster("documentdb-cluster", {
            applyImmediately: true,
            backupRetentionPeriod: 1,
            clusterIdentifier: "documentdb-cluster",
            engine: "docdb",
            masterPassword: String(process.env.DOCUMENT_DB_PASSWORD),
            masterUsername: String(process.env.DOCUMENT_DB_USERNAME),
            preferredBackupWindow: "07:00-09:00",
            skipFinalSnapshot: true,
            dbSubnetGroupName: subnetGroup.name
        });

        new aws.docdb.ClusterInstance(`document-db-cluster-instance-1`, {
            clusterIdentifier: cluster.id,
            identifier: `documentdb-cluster-instance-1`,
            instanceClass: "db.t3.medium"
        });

        this.documentDbCluster = cluster;

        this.databaseProxy = new aws.lambda.Function("db-proxy", {
            runtime: "nodejs12.x",
            handler: "handler.handler",
            role: defaultLambdaRole.role.arn,
            timeout: 30,
            memorySize: 512,
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("./code/awsDocumentDbProxy/build")
            }),
            environment: {
                variables: {
                    DOCUMENT_DB_SERVER: cluster.endpoint,
                    DOCUMENT_DB_PASSWORD: String(process.env.DOCUMENT_DB_PASSWORD),
                    DOCUMENT_DB_USERNAME: String(process.env.DOCUMENT_DB_USERNAME),
                    DOCUMENT_DB_DATABASE: String(process.env.DOCUMENT_DB_DATABASE),
                    LOG_COLLECTION: String(true)
                }
            },
            vpcConfig: {
                subnetIds: vpc.subnets.private.map(subNet => subNet.id),
                securityGroupIds: [vpc.vpc.defaultSecurityGroupId]
            }
        });
    }
}

export default DocumentDb;
