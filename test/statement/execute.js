/* eslint-env node, mocha */

require('dotenv').config();
const assert = require('assert');
const { Connection } = require('../../');

// const connection = new Connection(`${process.env.CONNECTION_STRING}`);

describe('.execute([calback])...', () => {
  it('...should throw a TypeError if function signature doesn\'t match accepted signatures.', async () => {
    const connection = new Connection(`${process.env.CONNECTION_STRING}`);
    const statement = await connection.createStatement();

    const EXECUTE_TYPE_ERROR = {
      name: 'TypeError',
      message: '[node-odbc]: Incorrect function signature for call to statement.execute({function}[optional]).',
    };
    const DUMMY_CALLBACK = () => {};
    const PREPARE_SQL = `INSERT INTO ${process.env.DB_SCHEMA}.${process.env.DB_TABLE} VALUES(?, ?, ?)`;

    assert.throws(() => {
      statement.execute(PREPARE_SQL);
    }, EXECUTE_TYPE_ERROR);
    assert.throws(() => {
      statement.execute(PREPARE_SQL, DUMMY_CALLBACK);
    }, EXECUTE_TYPE_ERROR);
    assert.throws(() => {
      statement.execute(1);
    }, EXECUTE_TYPE_ERROR);
    assert.throws(() => {
      statement.execute(1, DUMMY_CALLBACK);
    }, EXECUTE_TYPE_ERROR);
    assert.throws(() => {
      statement.execute(null);
    }, EXECUTE_TYPE_ERROR);
    assert.throws(() => {
      statement.execute(null, DUMMY_CALLBACK);
    }, EXECUTE_TYPE_ERROR);
    assert.throws(() => {
      statement.execute({});
    }, EXECUTE_TYPE_ERROR);
    assert.throws(() => {
      statement.execute({}, DUMMY_CALLBACK);
    }, EXECUTE_TYPE_ERROR);

    await connection.close();
  });
  describe('...with callbacks...', () => {
    it('...should execute if a valid SQL string has been prepared and valid values bound.', (done) => {
      const connection = new Connection(`${process.env.CONNECTION_STRING}`);
      connection.createStatement((error1, statement) => {
        assert.deepEqual(error1, null);
        assert.notDeepEqual(statement, null);
        statement.prepare(`INSERT INTO ${process.env.DB_SCHEMA}.${process.env.DB_TABLE} VALUES(?, ?, ?)`, (error2) => {
          assert.deepEqual(error2, null);
          statement.bind([1, 'bound', 10], (error3) => {
            assert.deepEqual(error3, null);
            statement.execute((error4, result4) => {
              assert.deepEqual(error4, null);
              assert.notDeepEqual(result4, null);
              connection.query(`SELECT * FROM ${process.env.DB_SCHEMA}.${process.env.DB_TABLE}`, (error5, result5) => {
                assert.deepEqual(error5, null);
                assert.notDeepEqual(result5, null);
                assert.deepEqual(result5.length, 1);
                assert.deepEqual(result5[0].ID, 1);
                assert.deepEqual(result5[0].NAME, 'bound');
                assert.deepEqual(result5[0].AGE, 10);
                connection.close((error6) => {
                  assert.deepEqual(error6, null);
                  done();
                });
              });
            });
          });
        });
      });
    });
  });
  describe('...with promises...', () => {
    it('...should execute if a valid SQL string has been prepared and valid values bound.', async () => {
      const connection = new Connection(`${process.env.CONNECTION_STRING}`);
      const statement = await connection.createStatement();
      assert.notDeepEqual(statement, null);
      await statement.prepare(`INSERT INTO ${process.env.DB_SCHEMA}.${process.env.DB_TABLE} VALUES(?, ?, ?)`);
      await statement.bind([1, 'bound', 10]);
      const result1 = await statement.execute();
      assert.notDeepEqual(result1, null);
      assert.doesNotReject(async () => {
        const result2 = await connection.query(`SELECT * FROM ${process.env.DB_SCHEMA}.${process.env.DB_TABLE}`);
        assert.notDeepEqual(result2, null);
        assert.deepEqual(result2.length, 1);
        assert.deepEqual(result2[0].ID, 1);
        assert.deepEqual(result2[0].NAME, 'bound');
        assert.deepEqual(result2[0].AGE, 10);
        await connection.close();
      });
    });
  }); // '...with promises...'
});