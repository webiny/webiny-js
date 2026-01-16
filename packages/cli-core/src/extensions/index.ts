import { CliCommandFactory } from "./CliCommand.js";
import { CliCommandFactoryDecorator } from "~/extensions/CliCommandDecorator.js";

export { CliCommandFactory };

export const definitions = [CliCommandFactory.def, CliCommandFactoryDecorator.def];
