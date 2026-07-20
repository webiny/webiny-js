import { createFeature } from "@webiny/feature/api";
import { Timer } from "./abstraction.js";

export const TimerFeature = createFeature<Timer.Interface>({
    name: "utils.timer",
    register(container, timer) {
        container.registerInstance(Timer, timer);
    }
});
