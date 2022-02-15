import fs from "fs";
import path from "path";

const content = `// This file is automatically updated via various scaffolding utilities.

export default () => [];`;

export default (folder: string): void => {
    fs.mkdirSync(folder, { recursive: true });

    const indexPath = path.join(folder, "index.ts");
    if (fs.existsSync(indexPath)) {
        return;
    }

    fs.writeFileSync(indexPath, content);
};
