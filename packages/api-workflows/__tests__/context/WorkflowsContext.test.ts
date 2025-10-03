
import { describe, it } from "vitest";
import { WorkflowsContext } from "~/context/WorkflowsContext.js";
import {useContextHandler} from "@webiny/testing";

describe("Workflows Context", () => {
    
    it("should ", async() => {
        const handler =  useContextHandler();
        const context = await handler.context();
        const workflowsContext = new WorkflowsContext(context);
    })
});
