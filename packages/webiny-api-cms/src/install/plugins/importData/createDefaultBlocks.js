// @flow
import get from "lodash/get";
import fs from "fs-extra";
import { blocks, files } from "./blocks";
import path from "path";

const createDefaultBlocks = async (context: Object) => {
    const { Element } = context.cms.entities;
    const { File } = context.files.entities;

    // Insert files
    for (let i = 0; i < files.length; i++) {
        const file = new File();
        file.populate(files[i]);
        await file.save();
    }

    for (let i = 0; i < blocks.length; i++) {
        let data = blocks[i];
        const element = new Element();
        element.populate(data);
        await element.save();
    }

    // Copy images.
    if (get(context, "cms.copyFiles", true) !== false) {
        const folder: string = path.resolve(get(context, "cms.copyFilesTo") || ".files");
        await fs.copy(`${__dirname}/blocks/images`, folder);
    }
};

export default createDefaultBlocks;
