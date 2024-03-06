import { ElementIdsProcessor } from "~/import/process/blocks/ElementIdsProcessor";
import { inputBlock, processedBlock } from "./block.mock";

describe("ElementIdsProcessor", () => {
    it("should generate stable block element IDs", () => {
        const processor = new ElementIdsProcessor();
        expect(processor.process(inputBlock)).toEqual(processedBlock);
    });
});
