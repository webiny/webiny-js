import { lambda } from "@pulumi/aws";

export const LAMBDA_RUNTIME = lambda.Runtime.NodeJS18dX;

export const DEFAULT_PROD_ENV_NAMES = ["prod", "production"];
