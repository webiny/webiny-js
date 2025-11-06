import { expect } from "vitest";
import * as matchers from "jest-extended";

expect.extend(matchers as any);

if (!process.env.AWS_REGION) {
    process.env.AWS_REGION = "us-east-1";
}
