import {assert} from 'chai';
import queryBuilder from './../src';

describe('DELETE statement test', function () {
    it('should generate a DELETE statement', async () => {
        const sql = queryBuilder.build({
            operation: 'delete',
            table: 'TestTable',
            where: {name: 'Test', enabled: true, deletedOn: null},
            limit: 10,
            offset: 0,
            order: {name: -1, createdOn: 1}
        });

        assert.equal(sql, `DELETE FROM TestTable WHERE (name = 'Test' AND enabled = true AND deletedOn IS NULL) ORDER BY name DESC, createdOn ASC LIMIT 10 OFFSET 0`);
    });
});