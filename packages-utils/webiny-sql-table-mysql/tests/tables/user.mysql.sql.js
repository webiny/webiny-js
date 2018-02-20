export default `CREATE TABLE \`Users\` (
	\`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
	\`name\` varchar(100),
	\`type\` enum('IT', 'Marketing', 'Animals'),
	\`createdOn\` datetime,
	PRIMARY KEY (\`id\`)
)`;
