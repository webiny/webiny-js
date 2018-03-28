// @flow
import extract from "./extract";
import glob from "glob";
import fs from "fs";

class Extractor {
    glob: string;
    content: string;
    listOnly: boolean;

    setGlob(glob: string): Extractor {
        this.glob = glob;
        return this;
    }

    setContent(content: string): Extractor {
        this.content = content;
        return this;
    }

    execute() {
        const results = {};

        if (this.glob) {
            const paths = glob.sync(this.glob);
            paths.forEach(path => {
                console.log(path);
                const contents = fs.readFileSync(path, "utf8");
                const parsed = extract(contents);
                for (let key in parsed) {
                    results[key] = parsed[key];
                }
            });
        }

        console.log(results);
    }

    setListOnly(flag: boolean = true): Extractor {
        this.listOnly = flag;
        return this;
    }
}

export default Extractor;
