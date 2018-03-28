export default `CREATE TABLE \`Users\` (
	\`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
	\`name\` varchar(100),
	\`default\` varchar(100) DEFAULT NULL,
	\`enabled\` tinyint DEFAULT 'false',
	\`age\` tinyint DEFAULT 50,
	\`type\` enum('IT', 'Marketing', 'Animals'),
	\`createdOn\` datetime,
	\`meta\` json,
	PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Main Users table...';`;
