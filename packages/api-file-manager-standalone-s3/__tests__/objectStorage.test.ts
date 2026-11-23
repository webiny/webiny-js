import { describe } from "vitest";
import { describeObjectStorageContract } from "../../api-file-manager-standalone/__tests__/contracts/objectStorageContract.js";
import { s3Backend } from "./s3Backend.js";
import { s3Endpoint } from "./s3Backend.js";

describe.runIf(s3Endpoint)("S3 object storage", () => {
    describeObjectStorageContract(s3Backend);
});
