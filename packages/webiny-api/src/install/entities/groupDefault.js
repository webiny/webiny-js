import { Group } from "./../..";

export default async () => {
    const entity = new Group();
    entity.populate({
        name: "Default",
        description: "A system group, assigned to Webiny API.",
        slug: "default"
    });

    await entity.save();
};
