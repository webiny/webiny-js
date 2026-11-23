import { describe } from "vitest";
import { describeUploadRoundTripContract } from "../../api-file-manager-standalone/__tests__/contracts/uploadRoundTripContract.js";
import { s3Backend } from "./s3Backend.js";
import { s3Endpoint } from "./s3Backend.js";

describe.runIf(s3Endpoint)("S3 upload round trip", () => {
    describeUploadRoundTripContract(s3Backend);
});
