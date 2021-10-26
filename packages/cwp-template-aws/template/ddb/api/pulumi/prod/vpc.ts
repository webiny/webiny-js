import * as aws from "@pulumi/aws";

class Vpc {
    vpc: aws.ec2.Vpc;
    subnets: {
        private: aws.ec2.Subnet[];
        public: aws.ec2.Subnet[];
    };
    constructor() {
        // Create VPC.
        const vpc = new aws.ec2.Vpc("webiny", {
            cidrBlock: "10.0.0.0/16"
        });

        // Create one public and two private subnets.
        const publicSubnet = new aws.ec2.Subnet("public", {
            vpcId: vpc.id,
            cidrBlock: "10.0.0.0/24",
            tags: { Name: "public-subnet" }
        });

        const availabilityZones = aws.getAvailabilityZones({
            state: "available"
        });

        const privateSubnet1 = new aws.ec2.Subnet("private-subnet-1", {
            vpcId: vpc.id,
            cidrBlock: "10.0.1.0/24",
            availabilityZone: availabilityZones.then(zone => zone.names[0]),
            tags: { Name: "private-subnet-1" }
        });

        const privateSubnet2 = new aws.ec2.Subnet("private-subnet-2", {
            vpcId: vpc.id,
            cidrBlock: "10.0.2.0/24",
            availabilityZone: availabilityZones.then(zone => zone.names[1]),
            tags: { Name: "private-subnet-2" }
        });

        // Create Internet gateway.
        const internetGateway = new aws.ec2.InternetGateway("internet-gateway", {
            vpcId: vpc.id
        });

        // Create a route table for both subnets.
        const publicSubnetRouteTable = new aws.ec2.RouteTable("public", {
            vpcId: vpc.id,
            routes: [
                {
                    cidrBlock: "0.0.0.0/0",
                    gatewayId: internetGateway.id
                }
            ]
        });

        // Create route table associations - links between subnets and route tables.
        new aws.ec2.RouteTableAssociation("public-subnet-route-table-association", {
            subnetId: publicSubnet.id,
            routeTableId: publicSubnetRouteTable.id
        });

        this.vpc = vpc;
        this.subnets = {
            public: [publicSubnet],
            private: [privateSubnet1, privateSubnet2]
        };
    }
}

const vpc = new Vpc();
export default vpc;
