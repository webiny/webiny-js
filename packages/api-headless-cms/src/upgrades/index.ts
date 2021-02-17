import version500beta4 from "./version500beta4";
import { SystemUpgrade } from "@webiny/system-upgrade/types";

export default (): SystemUpgrade[] => [version500beta4()];
