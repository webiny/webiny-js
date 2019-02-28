// @flow
import get from "lodash/get";
import fs from "fs-extra";
import { blocks } from "./blocks";

const createDefaultBlocks = async (context: Object) => {
    const { Element } = context.cms.entities;

    for (let i = 0; i < blocks.length; i++) {
        let data = blocks[i];
        const element = new Element();
        element.populate(data);
        await element.save();
    }

    // Copy images.
    if (get(context, "cms.copyFiles", true) !== false) {
        const pwd: string = (process.cwd(): any);
        await fs.copy(`${__dirname}/blocks/images`, pwd + "/static");
    }
};

export default createDefaultBlocks;
