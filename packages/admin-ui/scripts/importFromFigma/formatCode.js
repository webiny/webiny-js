import fs from "fs";
import { format } from "oxfmt";

const formatCode = async filePath => {
    const fileContentRaw = fs.readFileSync(filePath).toString("utf8");
    const result = await format(filePath, fileContentRaw);
    fs.writeFileSync(filePath, result.code);
};

export { formatCode };
