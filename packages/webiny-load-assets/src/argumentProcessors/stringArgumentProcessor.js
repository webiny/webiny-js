// @flow
import { type ArgumentProcessorType } from "webiny-load-assets/types";

export default ({
    canProcess(argument) {
        if (typeof argument !== "string") {
            return false;
        }

        return argument.startsWith("//") || argument.startsWith("http");
    },
    process(argument: any) {
        if (argument.endsWith(".js")) {
            return { type: "script", src: argument };
        }
        return { type: "link", src: argument };
    }
}: ArgumentProcessorType);
