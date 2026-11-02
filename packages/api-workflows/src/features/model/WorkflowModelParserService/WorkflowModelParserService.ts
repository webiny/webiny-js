import { WorkflowModelParser } from "~/features/model/WorkflowModelParser/abstractions.js";
import { WorkflowModelParserService as Abstraction } from "./abstractions.js";

class WorkflowModelParserServiceImpl implements Abstraction.Interface {
    public constructor(private parsers: WorkflowModelParser.Interface[]) {}

    public parse(model: string): WorkflowModelParser.Parsed | null {
        for (const parser of this.parsers) {
            const parsed = parser.parse(model);
            if (parsed) {
                return parsed;
            }
        }
        return null;
    }
}

export const WorkflowModelParserService = Abstraction.createImplementation({
    implementation: WorkflowModelParserServiceImpl,
    dependencies: [[WorkflowModelParser, { multiple: true }]]
});
