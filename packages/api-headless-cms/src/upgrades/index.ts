import version500Beta5 from "./version500beta5";
import { SystemUpgrade } from "@webiny/system-upgrade/types";

export default (): SystemUpgrade[] => [version500Beta5()];
