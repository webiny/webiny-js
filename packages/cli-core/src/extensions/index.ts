import { cliCommand as CliCommand } from "./CliCommand.js";
import { cliCommandDecorator } from "~/extensions/CliCommandDecorator.js";

export { CliCommand };

export const definitions = [CliCommand.definition, cliCommandDecorator.definition];
