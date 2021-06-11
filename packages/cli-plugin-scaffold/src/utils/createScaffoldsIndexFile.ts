import fs from "fs";
import path from "path";

const content = `// Do not modify!
// This file is automatically updated via various scaffolding utilities.

export default [];`;

export default folder => {
    fs.mkdirSync(folder, { recursive: true });

    const indexPath = path.join(folder, "index.ts");
    if (fs.existsSync(indexPath)) {
        return;
    }

    fs.writeFileSync(indexPath, content);
};
