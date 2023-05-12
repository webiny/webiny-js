import * as aws from "@pulumi/aws";
import { createAppModule, PulumiAppModule } from "@webiny/pulumi";

export type CoreVpc = PulumiAppModule<typeof CoreVpc>;

export const CoreVpc = createAppModule({
    name: "CoreVpc",
    config(app) {
        // Create VPC.
        const vpc = app.addResource(aws.ec2.Vpc, {
            name: "webiny",
            config: {
                cidrBlock: "10.0.0.0/16"
            }
        });

        // Create one public and two private subnets.
        const publicSubnet = app.addResource(aws.ec2.Subnet, {
            name: "public",
            config: {
                vpcId: vpc.output.id,
                cidrBlock: "10.0.0.0/24",
                tags: { Name: "public-subnet" }
            }
        });

        const availabilityZones = app.addHandler(() => {
            return aws.getAvailabilityZones({
                state: "available"
            });
        });

        const privateSubnet1 = app.addResource(aws.ec2.Subnet, {
            name: "private-subnet-1",
            config: {
                vpcId: vpc.output.id,
                cidrBlock: "10.0.1.0/24",
                availabilityZone: availabilityZones.apply(zone => zone.names[0]),
                tags: { Name: "private-subnet-1" }
            }
        });

        const privateSubnet2 = app.addResource(aws.ec2.Subnet, {
            name: "private-subnet-2",
            config: {
                vpcId: vpc.output.id,
                cidrBlock: "10.0.2.0/24",
                availabilityZone: availabilityZones.apply(zone => zone.names[1]),
                tags: { Name: "private-subnet-2" }
            }
        });

        // Create Internet gateway.
        const internetGateway = app.addResource(aws.ec2.InternetGateway, {
            name: "internet-gateway",
            config: {
                vpcId: vpc.output.id
            }
        });

        // Create NAT gateway.
        const elasticIpAllocation = app.addResource(aws.ec2.Eip, {
            name: "nat-gateway-elastic-ip",
            config: {
                vpc: true
            }
        });

        const natGateway = app.addResource(aws.ec2.NatGateway, {
            name: "nat-gateway",
            config: {
                allocationId: elasticIpAllocation.output.id,
                subnetId: publicSubnet.output.id
            }
        });

        // Create a route table for both subnets.
        const publicSubnetRouteTable = app.addResource(aws.ec2.RouteTable, {
            name: "public",
            config: {
                vpcId: vpc.output.id,
                routes: [
                    {
                        cidrBlock: "0.0.0.0/0",
                        gatewayId: internetGateway.output.id
                    }
                ]
            }
        });

        const privateSubnetRouteTable = app.addResource(aws.ec2.RouteTable, {
            name: "private",
            config: {
                vpcId: vpc.output.id,
                routes: [
                    {
                        cidrBlock: "0.0.0.0/0",
                        natGatewayId: natGateway.output.id
                    }
                ]
            }
        });

        // Create route table associations - links between subnets and route tables.
        app.addResource(aws.ec2.RouteTableAssociation, {
            name: "public-subnet-route-table-association",
            config: {
                subnetId: publicSubnet.output.id,
                routeTableId: publicSubnetRouteTable.output.id
            }
        });

        app.addResource(aws.ec2.RouteTableAssociation, {
            name: "private-subnet-1-route-table-association",
            config: {
                subnetId: privateSubnet1.output.id,
                routeTableId: privateSubnetRouteTable.output.id
            }
        });

        app.addResource(aws.ec2.RouteTableAssociation, {
            name: "private-subnet-2-route-table-association",
            config: {
                subnetId: privateSubnet2.output.id,
                routeTableId: privateSubnetRouteTable.output.id
            }
        });

        const subnets = {
            public: [publicSubnet],
            private: [privateSubnet1, privateSubnet2]
        };

        const routeTables = {
            privateSubnets: privateSubnetRouteTable,
            publicSubnets: publicSubnetRouteTable
        };

        app.addOutputs({
            vpcPublicSubnetIds: subnets.public.map(subNet => subNet.output.id),
            vpcPrivateSubnetIds: subnets.private.map(subNet => subNet.output.id),
            vpcSecurityGroupIds: [vpc.output.defaultSecurityGroupId]
        });

        return {
            vpc,
            subnets,
            routeTables
        };
    }
});
