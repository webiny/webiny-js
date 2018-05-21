import { User, Group } from "webiny-api";

export default async () => {
    const entity = new User();
    const group = await Group.findOne({ query: { slug: "security" } });

    entity.populate({
        password: "12345678",
        email: "admin@webiny.com",
        groups: [group]
    });

    await entity.save();
};
