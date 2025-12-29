import { CliCommand } from "./CliCommand.js";
import { CliCommandDecorator } from "~/extensions/CliCommandDecorator.js";

export { CliCommand };

export const definitions = [CliCommand.definition, CliCommandDecorator.definition];
