import chalk from "chalk";
import Log from "./log";

export default class ConsoleLog extends Log {
    constructor(message: string, data: {}, tags: Array<string>) {
        super(message, data, tags);
        ConsoleLog.output(message, data, tags);
    }

    static output(message, data, tags) {
        const type = ConsoleLog.__getTypeFromTags(tags);
        let color = ConsoleLog.__getColorFromType(type);

        if (tags.includes("start") && tags.includes("table")) {
            console.log(chalk.blue(ConsoleLog.__outputHorizontalLine()));
        }

        if (tags.includes("sync") && tags.includes("finish")) {
            console.log(chalk.blue(ConsoleLog.__outputHorizontalLine()));
        }

        if (tags.includes("generated") && tags.includes("sql")) {
            color = "default";
        }

        console.log(chalk[color](message));

        if (tags.includes("start") && tags.includes("table")) {
            console.log(chalk.blue(ConsoleLog.__outputHorizontalLine()));
        }
    }

    static __getColorFromType(type): string {
        switch (type) {
            case "error":
                return "red";
            case "warning":
                return "yellow";
            case "success":
                return "green";
            case "info":
                return "blue";
            default:
                return "default";
        }
    }

    static __getTypeFromTags(tags: Array<string>): ?string {
        switch (true) {
            case tags.includes("error"):
                return "error";
            case tags.includes("warning"):
                return "warning";
            case tags.includes("success"):
                return "success";
            case tags.includes("info"):
                return "info";
            default:
                return null;
        }
    }

    static __outputHorizontalLine() {
        let output = "";
        for (let i = 0; i < 60; i++) {
            output += "\u2500";
        }
        return output;
    }
}
