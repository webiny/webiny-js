// @flow
// Logical Operators (A-Z)
import $and from "./logical/and";
import $or from "./logical/or";

// Comparison operators (A-Z)
import $all from "./comparison/all";
import $eq from "./comparison/eq";
import $in from "./comparison/in";
import $jsonArrayFindValue from "./comparison/jsonArrayFindValue";
import $jsonArrayStrictEquality from "./comparison/jsonArrayStrictEquality";
import $like from "./comparison/like";
import $ne from "./comparison/ne";
import $search from "./comparison/search";

export default {
    $or,
    $and,

    $all,
    $eq,
    $in,
    $jsonArrayFindValue,
    $jsonArrayStrictEquality,
    $like,
    $ne,
    $search
};
