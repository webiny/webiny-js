// @flow
import type { LogType } from "../types";

class Log {
    message: string;
    type: LogType;
    data: ?{};

    constructor(message: string, type: LogType, data: ?{}) {
        this.message = message;
        this.data = data;
        this.type = type;
    }

    getMessage(): string {
        return this.message;
    }

    getType(): LogType {
        return this.type;
    }

    getData(): ?{} {
        return this.data;
    }
}

export default Log;
