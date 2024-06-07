const MAX_RUNNING_MINUTES = 14;
const MAX_RUNNING_MILLISECONDS = MAX_RUNNING_MINUTES * 60 * 1000;

export class CustomTimer {
    private readonly startTime: number;

    public constructor() {
        this.startTime = Date.now();
    }

    public getRemainingMilliseconds(): number {
        return this.startTime + MAX_RUNNING_MILLISECONDS - Date.now(); // 14 minutes
    }
}
