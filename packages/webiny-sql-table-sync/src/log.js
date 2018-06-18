// @flow
class Log {
    message: string;
    tags: Array<string>;
    data: {};

    constructor(message: string, data: {}, tags: Array<string> = []) {
        this.message = message;
        this.data = data;
        this.tags = tags;
    }

    getMessage(): string {
        return this.message;
    }

    getTags(): Array<string> {
        return this.tags;
    }

    getData(): ?{} {
        return this.data;
    }
}

export default Log;
