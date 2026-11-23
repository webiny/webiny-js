import os from "os";
import path from "path";

// One folder per machine holds the Pulumi CLI and its plugins for every Webiny project, the same
// way Yarn's global store holds packages. Projects keep only their own PULUMI_HOME.
export const getPulumiStoreFolder = () => {
    return path.join(os.homedir(), ".webiny", "pulumi");
};
