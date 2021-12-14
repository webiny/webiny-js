import chalk from "chalk";
import { Logger } from "~/types";

type Colors = "red" | "yellow" | "green" | "blue" | "white" | "cyan" | "magenta" | "black";
const output = (color: Colors, text: string): void => {
    if (typeof chalk[color] !== "function") {
        throw new Error(`Color "${color}" does not exist in chalk library.`);
    }
    console.log(chalk[color](text));
};

export const createLogger = (): Logger => {
    return {
        red: (text: string) => output("red", text),
        green: (text: string) => output("green", text),
        yellow: (text: string) => output("yellow", text)
    };
};
