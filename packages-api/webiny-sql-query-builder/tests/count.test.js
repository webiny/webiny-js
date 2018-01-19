import {assert} from 'chai';
import queryBuilder from './../src';

describe('SELECT statement test', function () {
    it('should generate a SELECT statement', async () => {
        const sql = queryBuilder.build({
            operation: 'count',
            table: 'TestTable',
            where: {name: 'Test', enabled: true, deletedOn: null},
            limit: 10,
            offset: 2,
            order: {name: -1, createdOn: 1}
        });

        assert.equal(sql, `SELECT COUNT(*) AS count FROM TestTable WHERE (name = 'Test' AND enabled = true AND deletedOn IS NULL) ORDER BY name DESC, createdOn ASC LIMIT 10 OFFSET 2`);
    });
});