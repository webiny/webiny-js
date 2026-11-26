import { describeUploadRoundTripContract } from "./contracts/uploadRoundTripContract.js";
import { storageBackends } from "./utils/storageBackends.js";

for (const backend of storageBackends) {
    describeUploadRoundTripContract(backend);
}
