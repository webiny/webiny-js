import { Plugin } from "@webiny/plugins/types";
import { ContextInterface } from "@webiny/handler/types";
import { SemVer } from "semver";

/**
 * A plugin type that defines how the system upgrade will look like.
 */
export interface SystemUpgrade<T extends ContextInterface> extends Plugin {
    /**
     * A plugin type.
     */
    type: "system-upgrade";
    /**
     * A version of the Webiny that this plugin upgrades the system to.
     * Also uses as a check if plugin should be applied.
     */
    version: string;
    /**
     * Run checks if system upgrade should be applied.
     * This is meant to have check logic before the apply method.
     *
     * @param context Current application context.
     * @param codeVersion A version of the code built.
     */
    isApplicable: (context: T, codeVersion: SemVer) => Promise<boolean>;
    /**
     * Method that applies the upgrade. Will not run unless version and isApplicable are allowing it.
     */
    apply: (context: T) => Promise<void>;
}
