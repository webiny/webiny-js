import { createFeature } from "@webiny/feature/api/index.js";
import { EqualOperator } from "./operators/EqualOperator.js";
import { NotOperator } from "./operators/NotOperator.js";
import { InOperator } from "./operators/InOperator.js";
import { NotInOperator } from "./operators/NotInOperator.js";
import { ContainsOperator } from "./operators/ContainsOperator.js";
import { NotContainsOperator } from "./operators/NotContainsOperator.js";
import { GtOperator } from "./operators/GtOperator.js";
import { GteOperator } from "./operators/GteOperator.js";
import { LtOperator } from "./operators/LtOperator.js";
import { LteOperator } from "./operators/LteOperator.js";
import { BetweenOperator } from "./operators/BetweenOperator.js";
import { NotBetweenOperator } from "./operators/NotBetweenOperator.js";
import { StartsWithOperator } from "./operators/StartsWithOperator.js";
import { NotStartsWithOperator } from "./operators/NotStartsWithOperator.js";
import { SqlOperatorRegistry } from "./SqlOperatorRegistry.js";

export const SqlOperatorFeature = createFeature({
    name: "cms.sql.operatorFeature",
    register: container => {
        container.register(EqualOperator);
        container.register(NotOperator);
        container.register(InOperator);
        container.register(NotInOperator);
        container.register(ContainsOperator);
        container.register(NotContainsOperator);
        container.register(GtOperator);
        container.register(GteOperator);
        container.register(LtOperator);
        container.register(LteOperator);
        container.register(BetweenOperator);
        container.register(NotBetweenOperator);
        container.register(StartsWithOperator);
        container.register(NotStartsWithOperator);
        container.register(SqlOperatorRegistry).inSingletonScope();
    }
});
