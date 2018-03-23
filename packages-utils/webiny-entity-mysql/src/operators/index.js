// @flow

// Logical Operators (A-Z)
import $and from "./logical/and";
import $or from "./logical/or";

// Comparison operators (A-Z)
import $all from "./comparison/all";
import $eq from "./comparison/eq";
import $gt from "./comparison/gt";
import $gte from "./comparison/gte";
import $in from "./comparison/in";
import $jsonArrayFindValue from "./comparison/jsonArrayFindValue";
import $jsonArrayStrictEquality from "./comparison/jsonArrayStrictEquality";
import $like from "./comparison/like";
import $lt from "./comparison/lt";
import $lte from "./comparison/lte";
import $ne from "./comparison/ne";
import $search from "./comparison/search";

export default {
    $or,
    $and,

    $all,
    $eq,
    $gt,
    $gte,
    $in,
    $jsonArrayFindValue,
    $jsonArrayStrictEquality,
    $like,
    $lt,
    $lte,
    $ne,
    $search
};
