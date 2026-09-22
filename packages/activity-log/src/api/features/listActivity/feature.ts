import { type Container, createFeature } from "@webiny/feature/api";
import { ListActivityUseCase } from "./ListActivityUseCase.js";
import { PassThroughChangesetFilter } from "./PassThroughChangesetFilter.js";
import { ShowAllSummaries } from "./ShowAllSummaries.js";

export const ListActivityFeature = createFeature({
    name: "ActivityLog/ListActivity",
    register(container: Container) {
        container.register(PassThroughChangesetFilter).inSingletonScope();
        container.register(ShowAllSummaries).inSingletonScope();
        container.register(ListActivityUseCase);
    }
});
