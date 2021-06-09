import filesPlugins from "./operations/files";
import settingsPlugins from "./operations/settings";
import systemPlugins from "./operations/system";

export default () => [
    filesPlugins(),
    settingsPlugins(),
    systemPlugins(),
];