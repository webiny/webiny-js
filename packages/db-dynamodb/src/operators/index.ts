import $and from "./logical/and";
import $or from "./logical/or";
import $beginsWith from "./comparison/beginsWith";
import $between from "./comparison/between";
import $gt from "./comparison/gt";
import $gte from "./comparison/gte";
import $lt from "./comparison/lt";
import $lte from "./comparison/lte";
import $eq from "./comparison/eq";

export default {
    $and,
    $or,
    $beginsWith,
    $between,
    $eq,
    $gt,
    $gte,
    $lt,
    $lte
};
