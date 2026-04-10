import { createFeature } from "@webiny/feature/api";
import { EqFilter } from "./filters/EqFilter.js";
import { GtFilter } from "./filters/GtFilter.js";
import { GteFilter } from "./filters/GteFilter.js";
import { LtFilter } from "./filters/LtFilter.js";
import { LteFilter } from "./filters/LteFilter.js";
import { BetweenFilter } from "./filters/BetweenFilter.js";
import { InFilter } from "./filters/InFilter.js";
import { AndInFilter } from "./filters/AndInFilter.js";
import { ContainsFilter } from "./filters/ContainsFilter.js";
import { FuzzyFilter } from "./filters/FuzzyFilter.js";
import { StartsWithFilter } from "./filters/StartsWithFilter.js";
import { ValueFilterRegistry } from "./ValueFilterRegistry.js";

export const ValueFilterFeature = createFeature({
    name: "Db/DynamoDB/ValueFilterFeature",
    register: container => {
        container.register(EqFilter);
        container.register(GtFilter);
        container.register(GteFilter);
        container.register(LtFilter);
        container.register(LteFilter);
        container.register(BetweenFilter);
        container.register(InFilter);
        container.register(AndInFilter);
        container.register(ContainsFilter);
        container.register(FuzzyFilter);
        container.register(StartsWithFilter);
        container.register(ValueFilterRegistry);
    }
});
