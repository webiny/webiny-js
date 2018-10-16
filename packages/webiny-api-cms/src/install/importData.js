// @flow
import setupEntities from "../dataSource/setupEntities";

export default async (config: Object) => {
    const { Category } = setupEntities({ config });

    const blogCategory = new Category();
    blogCategory.populate({
        name: "Blog",
        slug: "blog",
        url: "/blog/",
        layout: "blog"
    });
    await blogCategory.save();

    const staticCategory = new Category();
    staticCategory.populate({
        name: "Static",
        slug: "static",
        url: "/",
        layout: "static"
    });
    await staticCategory.save();
};
