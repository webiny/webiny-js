import { createImplementation } from "@webiny/di";
import { OnEntryBeforeCreate } from "webiny/api/cms/features";

class MyOnEntryBeforeCreate implements OnEntryBeforeCreate.Interface {
    execute({ model, entry }: OnEntryBeforeCreate.Params) {
        // Do something.
    }
}

export default createImplementation({
    abstraction: OnEntryBeforeCreate,
    implementation: MyOnEntryBeforeCreate,
    dependencies: [GetCmsEntry, GetCmsModel]
});
