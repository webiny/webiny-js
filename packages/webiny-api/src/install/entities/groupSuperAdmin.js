import { Group } from "./../..";

export default async () => {
    const entity = new Group();
    entity.populate({
        name: "Super Admin",
        description: "A group that is applied to both authenticated and anonymous identities.",
        slug: "default"
    });

    await entity.save();
};
