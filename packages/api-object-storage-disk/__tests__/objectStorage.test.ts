import { describeObjectStorageContract } from "../../api-object-storage/__tests__/contracts/objectStorageContract.js";
import { diskBackend } from "./diskBackend.js";

describeObjectStorageContract(diskBackend);
