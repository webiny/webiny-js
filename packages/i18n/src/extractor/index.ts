import extract from "./extract.js";
import fastGlob from "fast-glob";
import fs from "node:fs";

export interface ExtractorResults {
    [key: string]: string;
}
class Extractor {
    private glob: string | undefined;
    public content = "";
    public listOnly = false;

    public setGlob(value: string): Extractor {
        this.glob = value;
        return this;
    }

    public setContent(content: string): Extractor {
        this.content = content;
        return this;
    }

    public execute(): ExtractorResults {
        const results: ExtractorResults = {};

        if (!this.glob) {
            return results;
        }
        const paths = fastGlob.sync(this.glob);
        paths.forEach(path => {
            const contents = fs.readFileSync(path, "utf8");
            const parsed = extract(contents);
            for (const key in parsed) {
                results[key] = parsed[key];
            }
        });

        return results;
    }

    public setListOnly(flag = true): Extractor {
        this.listOnly = flag;
        return this;
    }
}

export default Extractor;
