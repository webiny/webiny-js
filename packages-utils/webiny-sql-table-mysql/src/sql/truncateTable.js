export default table => {
    return `TRUNCATE TABLE \`${table.getName()}\``;
};
