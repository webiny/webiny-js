import { createFeature, createAbstraction } from "webiny/api";

export interface IMyService {
    hello(): string;
}

export const MyService = createAbstraction<IMyService>("MyService");

export namespace MyService {
    export type Interface = IMyService;
}

export default createFeature({
    name: "MyApp/MyFeature",
    register(container) {
        container.registerInstance(MyService, {
            hello() {
                return "Hello from MyService!";
            }
        });
    }
});
