const groups = ["5af92fb446e6daa0f8150cce", "5af935db46e6daa441a54cdb"];

const sql = `INSERT INTO \`Security_Users\` (\`id\`, \`deleted\`, \`owner\`, \`groups\`, \`email\`, \`password\`, \`enabled\`)
VALUES
	('5af92fb546e6daa0f8150ccf', 0, '5af92fb546e6daa0f8150ccf', '${JSON.stringify(
        groups
    )}', 'admin@webiny.com', '$2a$10$Fr.3v.iHZbD3udIWTidW8Of9pWLHpi5AolUBOpR.rqs3r0gfIVn36', 1);
`;

export default sql;
