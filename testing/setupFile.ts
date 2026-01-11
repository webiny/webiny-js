import { expect } from "vitest";
import * as matchers from "jest-extended";

expect.extend(matchers as any);

process.env.AWS_REGION = "local";
