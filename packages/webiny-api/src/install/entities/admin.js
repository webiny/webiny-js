// @flow
import { User, Policy } from "./../..";

export default async () => {
    const entity = new User();
    const superAdminPolicy = await Policy.findOne({ query: { slug: "super-admin" } });

    entity.populate({
        firstName: "John",
        lastName: "Doe",
        password: "12345678",
        email: "admin@webiny.com",
        policies: [superAdminPolicy]
    });

    await entity.save();
};
