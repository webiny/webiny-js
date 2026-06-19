import { createFeature } from "@webiny/feature/api/index.js";
import { OpenSearchQueryBuilderOperatorRegistry } from "./abstractions/OpenSearchQueryBuilderOperatorRegistry.js";
import { OpenSearchQueryBuilderOperatorRegistryImpl } from "./OpenSearchQueryBuilderOperatorRegistry.js";
import { Equal } from "./operators/Equal.js";
import { Not } from "./operators/Not.js";
import { Contains } from "./operators/Contains.js";
import { NotContains } from "./operators/NotContains.js";
import { Between } from "./operators/Between.js";
import { NotBetween } from "./operators/NotBetween.js";
import { GreaterThan } from "./operators/GreaterThan.js";
import { GreaterThanOrEqual } from "./operators/GreaterThanOrEqual.js";
import { LesserThan } from "./operators/LesserThan.js";
import { LesserThanOrEqual } from "./operators/LesserThanOrEqual.js";
import { In } from "./operators/In.js";
import { AndIn } from "./operators/AndIn.js";
import { NotIn } from "./operators/NotIn.js";
import { StartsWith } from "./operators/StartsWith.js";
import { NotStartsWith } from "./operators/NotStartsWith.js";

export const OpenSearchQueryBuilderOperatorFeature = createFeature({
    name: "opensearch.internal.queryBuilderOperator",
    register(container) {
        container.registerInstance(
            OpenSearchQueryBuilderOperatorRegistry,
            new OpenSearchQueryBuilderOperatorRegistryImpl([
                new Equal(),
                new Not(),
                new Contains(),
                new NotContains(),
                new Between(),
                new NotBetween(),
                new GreaterThan(),
                new GreaterThanOrEqual(),
                new LesserThan(),
                new LesserThanOrEqual(),
                new In(),
                new AndIn(),
                new NotIn(),
                new StartsWith(),
                new NotStartsWith()
            ])
        );
    }
});
