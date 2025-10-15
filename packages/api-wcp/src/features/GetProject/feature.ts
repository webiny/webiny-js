import { createFeature } from "@webiny/feature";
import type { WcpContext } from "~/types.js";
import { GetProjectUseCase as GetProjectUseCaseImpl } from "./GetProjectUseCase.js";
import { GetProjectUseCase } from "./abstractions.js";

export { GetProjectUseCase };

export const GetProject = createFeature({
    name: "Wcp/GetProject",
    register(container, context: WcpContext) {
        container.registerFactory(GetProjectUseCase, () => {
            return new GetProjectUseCaseImpl(() => context.wcp.getProject());
        });
    }
});
