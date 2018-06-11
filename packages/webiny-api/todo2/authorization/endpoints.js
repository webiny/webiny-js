// @flow
import { Endpoint } from "webiny-api";
import type { ApiContainer } from "webiny-api";

export class Class1 extends Endpoint {
    init(api: ApiContainer) {
        api.get("method1", "/m1", () => {});
        api.get("method2", "/m2", () => {});
    }
}

Class1.classId = "class1";

export class Class2 extends Endpoint {
    init(api: ApiContainer) {
        api.get("method1", "/m1", () => {});
        api.get("method2", "/m2", () => {});
        api.get("method3", "/m3", () => {});
    }
}

Class2.classId = "class2";

export class Class3 extends Endpoint {
    init(api: ApiContainer) {
        api.get("method1", "/m1", () => {});
        api.get("method2", "/m2", () => {});
        api.get("method3", "/m3", () => {});
        api.get("method4", "/m4", () => {});
        api.get("method5", "/m5", () => {});
    }
}

Class3.classId = "class3";
