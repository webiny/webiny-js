import { describeObjectStorageContract } from "./contracts/objectStorageContract.js";
import { diskBackend } from "./utils/storageBackends.js";

describeObjectStorageContract(diskBackend);
