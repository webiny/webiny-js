import { createFeature } from "@webiny/feature/api/index.js";
import { OpenSearchQueryBuilderOperatorRegistry } from "./OpenSearchQueryBuilderOperatorRegistry.js";
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
        container.register(Equal).inSingletonScope();
        container.register(Not).inSingletonScope();
        container.register(Contains).inSingletonScope();
        container.register(NotContains).inSingletonScope();
        container.register(Between).inSingletonScope();
        container.register(NotBetween).inSingletonScope();
        container.register(GreaterThan).inSingletonScope();
        container.register(GreaterThanOrEqual).inSingletonScope();
        container.register(LesserThan).inSingletonScope();
        container.register(LesserThanOrEqual).inSingletonScope();
        container.register(In).inSingletonScope();
        container.register(AndIn).inSingletonScope();
        container.register(NotIn).inSingletonScope();
        container.register(StartsWith).inSingletonScope();
        container.register(NotStartsWith).inSingletonScope();
        // Container scoped: each request builds the registry from its own container, so operators that
        // extensions register per request are included. As a singleton it would be built once, from
        // the root container's registrations only (@webiny/di builds a singleton from the container
        // that registers it), and would never see operators registered in a request container.
        container.register(OpenSearchQueryBuilderOperatorRegistry).inContainerScope();
    }
});
