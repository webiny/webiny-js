import {
    CliCommandScaffoldCallableArgs,
    CliCommandScaffoldCallableWithErrorArgs
} from "@webiny/cli-plugin-scaffold/types";
import { Plugin } from "@webiny/plugins/types";

export interface CliPluginsScaffoldCi<T> extends Plugin {
    type: "cli-plugin-scaffold-ci";
    provider: string;
    generate: (args: CliCommandScaffoldCallableArgs<T>) => Promise<any>;
    onGenerate?: (args: CliCommandScaffoldCallableArgs<T>) => Promise<any>;
    onSuccess?: (args: CliCommandScaffoldCallableArgs<T>) => Promise<any>;
    onError?: (args: CliCommandScaffoldCallableWithErrorArgs<T>) => Promise<any>;
}
