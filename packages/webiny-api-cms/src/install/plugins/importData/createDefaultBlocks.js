// @flow
import blocks from "./blocks";
import fs from "fs-extra";

const createDefaultBlocks = async (context: Object) => {
    const { Element } = context.cms.entities;

    for (let i = 0; i < blocks.length; i++) {
        let data = blocks[i];
        const element = new Element();
        element.populate(data);
        await element.save();
    }

    // Copy images.
    const pwd: string = (process.cwd(): any);
    await fs.copy(`${__dirname}/blocks/images`, pwd + "/static");
};

export default createDefaultBlocks;
