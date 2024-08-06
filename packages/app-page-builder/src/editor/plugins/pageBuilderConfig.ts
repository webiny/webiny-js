import { PbConfigPluginType, PbConfigType } from "../../types";

export default (config: PbConfigType) =>
    ({
        type: "pb-config",
        config() {
            return config;
        }
    }) as PbConfigPluginType;
