export default `CREATE TABLE \`ComplexRecords\` (
	\`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
	\`firstName\` varchar(100),
	\`lastName\` varchar(100),
	\`age\` int(10),
	\`type\` enum('professional', 'shoplifter', 'brandRepresentative') DEFAULT 'professional',
	\`createdOn\` datetime DEFAULT 'NOW',
	PRIMARY KEY (\`id\`),
	KEY \`age\` (\`id\`),
	UNIQUE KEY \`firstNameLastName\` (\`firstName\`, \`lastName\`),
	FULLTEXT KEY \`searchIndex\` (\`someSearchField\`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8 COLLATE=utf888 COMMENT='Main Complex records table...'`;
