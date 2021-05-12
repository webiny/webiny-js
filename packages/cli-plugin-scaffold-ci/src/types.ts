import { CliCommandScaffoldCallableArgs } from "@webiny/cli-plugin-scaffold/types";
import { Plugin } from "@webiny/plugins/types";

export interface CliPluginsScaffoldCi<T> extends Plugin {
    type: "cli-plugin-scaffold-ci";
    provider: string;
    generate: (args: CliCommandScaffoldCallableArgs<T>) => Promise<any>;
}
