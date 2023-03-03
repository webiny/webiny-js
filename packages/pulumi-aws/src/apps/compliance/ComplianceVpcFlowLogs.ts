import * as aws from "@pulumi/aws";
import { createAppModule } from "@webiny/pulumi";
import { VpcConfig } from "@webiny/pulumi-aws/apps";

export const ComplianceVpcFlowLogs = createAppModule({
    name: "ComplianceVpcFlowLogs",
    config({ addResource, getModule }) {
        const vpcConfig = getModule(VpcConfig);
        if (!vpcConfig.enabled) {
            return;
        }

        const vpcFlowLogsLogGroup = addResource(aws.cloudwatch.LogGroup, {
            name: "vpc-flow-logs-log-group",
            config: {}
        });

        const vpcFlowLogsRole = addResource(aws.iam.Role, {
            name: "vpc-flow-logs-role",
            config: {
                assumeRolePolicy: JSON.stringify({
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Sid: "",
                            Effect: "Allow",
                            Principal: {
                                Service: "vpc-flow-logs.amazonaws.com"
                            },
                            Action: "sts:AssumeRole"
                        }
                    ]
                })
            }
        });

        addResource(aws.iam.RolePolicy, {
            name: "vpc-flow-logs-role-policy",
            config: {
                role: vpcFlowLogsRole.output.id,
                policy: JSON.stringify({
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Action: [
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents",
                                "logs:DescribeLogGroups",
                                "logs:DescribeLogStreams"
                            ],
                            Effect: "Allow",
                            Resource: "*"
                        }
                    ]
                })
            }
        });

        const vpcFlowLog = addResource(aws.ec2.FlowLog, {
            name: "vpc-flow-log",
            config: {
                iamRoleArn: vpcFlowLogsRole.output.arn,
                logDestination: vpcFlowLogsLogGroup.output.arn,
                trafficType: "ALL",
                vpcId: vpcConfig.vpcId
            }
        });

        return { vpcFlowLog };
    }
});
