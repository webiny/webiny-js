export default ({ model, field }) => {
    return /* GraphQL */ `(
        page: Int
        perPage: Int
        where: JSON
        sort: JSON
        search: SearchInput
    )`;
};
