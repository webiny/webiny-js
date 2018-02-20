export default table => {
    return `SHOW TABLES LIKE \`${table.getName()}\``;
};
