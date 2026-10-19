import { createFeature } from "@webiny/feature/api";
import { KeyValueLease } from "./KeyValueLease.js";

export const LeaseFeature = createFeature({
    name: "Lease",
    register(container) {
        container.register(KeyValueLease);
    }
});
