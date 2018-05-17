import { User, Group } from "webiny-api";

export default async () => {
    const entity = new User();
    entity.populate({
        groups: [await Group.findOne("security")],
        password: "12345678",
        email: "admin@webiny.com"
    });

    await entity.save();
};
