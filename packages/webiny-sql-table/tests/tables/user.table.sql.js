export default `CREATE TABLE \`Users\` (
	\`id\` INT(5) unsigned DEFAULT NULL AUTO_INCREMENT,
	\`total\` INT(6) DEFAULT NULL,
	\`totalViews\` INT(7) unsigned DEFAULT NULL,
	\`name\` CHAR(8) DEFAULT NULL,
	PRIMARY KEY  (\`id\`),
	UNIQUE KEY name (\`name\`),
	UNIQUE KEY totals (\`total\`, \`totalViews\`)
)`;
