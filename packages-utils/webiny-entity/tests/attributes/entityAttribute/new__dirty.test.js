import { assert } from "chai";
import { One, Two } from "../../entities/oneTwoThree";
import { QueryResult } from "../../../src";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();

describe("populate test", function() {
    beforeEach(() => One.getEntityPool().flush());
    afterEach(() => sandbox.restore());
});
