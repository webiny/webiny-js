import path from "path";
import { type IPathModel, type IPathModelDto } from "~/abstractions/models/index.js";
import fs from "fs";

export class PathModel implements IPathModel {
    constructor(private value: string) {}

    join(...paths: string[]) {
        const joinedPath = path.join(this.value, ...paths);
        return PathModel.from(joinedPath);
    }

    existsSync() {
        return fs.existsSync(this.value);
    }

    toString(): string {
        return this.value;
    }

    toDto(): IPathModelDto {
        return { value: this.value };
    }

    static from(value: string | IPathModelDto | PathModel): PathModel {
        if (value instanceof PathModel) {
            return value;
        }

        if (typeof value === "string") {
            return new PathModel(value);
        }

        return new PathModel(value.value);
    }
}
