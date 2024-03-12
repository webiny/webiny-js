import { ITimer } from "~/timer/abstractions/ITimer";

const MAX_RUNNING_MINUTES = 14;
const MAX_RUNNING_MILLISECONDS = MAX_RUNNING_MINUTES * 60 * 1000;

export class CustomTimer implements ITimer {
    private readonly startTime: number;

    public constructor() {
        this.startTime = Date.now();
    }

    public getRemainingMilliseconds(): number {
        const result = this.startTime + MAX_RUNNING_MILLISECONDS - Date.now(); // 14 minutes
        console.log(
            "It looks like the Lambda Context getRemainingTimeInMillis does not exist. Mocked remaining time:",
            result
        );
        return result;
    }
}
