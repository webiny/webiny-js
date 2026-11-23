import { describeUploadRoundTripContract } from "./contracts/uploadRoundTripContract.js";
import { diskBackend } from "./utils/storageBackends.js";

describeUploadRoundTripContract(diskBackend);
