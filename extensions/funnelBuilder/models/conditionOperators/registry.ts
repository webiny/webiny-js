import { EmptyConditionOperator } from "./EmptyConditionOperator";
import { EqConditionOperator } from "./EqConditionOperator";
import { GtConditionOperator } from "./GtConditionOperator";
import { GteConditionOperator } from "./GteConditionOperator";
import { IncludesConditionOperator } from "./IncludesConditionOperator";
import { LtConditionOperator } from "./LtConditionOperator";
import { LteConditionOperator } from "./LteConditionOperator";
import { NeqConditionOperator } from "./NeqConditionOperator";
import { NotEmptyConditionOperator } from "./NotEmptyConditionOperator";
import { NotIncludesConditionOperator } from "./NotIncludesConditionOperator";

export const registry = [
    EmptyConditionOperator,
    EqConditionOperator,
    GtConditionOperator,
    GteConditionOperator,
    IncludesConditionOperator,
    LtConditionOperator,
    LteConditionOperator,
    NeqConditionOperator,
    NotEmptyConditionOperator,
    NotIncludesConditionOperator
];
