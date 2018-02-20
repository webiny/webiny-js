export default table => {
    return `DROP TABLE \`${table.getName()}\``;
};
