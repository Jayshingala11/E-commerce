const mysql = require(`mysql2`);

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'e-com'
});

class DatabaseHelper {

    async getConnection() {
        
        return new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if(err) {
                    console.log(`Err getting MySQL connection`, err);
                    reject(err);
                }
                resolve(connection);
            });
        })
    }

    async release(connection) {
        connection.release();
    }

    async select(connection, table, params, where = '', joins) {
        return new Promise((resolve, reject) => {
            let qry = `SELECT ${params} FROM ${table} ${joins ? joins : ''} WHERE 1=1 ${where} `;
            console.log(`[qry] ::: `, qry);
            connection.query(qry, function (err, results) {
                if (err) {
                    reject(err);
                }

                console.log(`[results] :::`, results);
                resolve(results);
            });
        })
    }


    async insert(connection, table, params) {
        return new Promise((resolve, reject) => {
            let qry = `INSERT INTO ${table} SET ?`
            console.log(`[qry] ::: `, qry);
            connection.query(qry, [params], function (err, results) {
                if (err) {
                    reject(err);
                }

                console.log(`[results] :::`, results);
                resolve(results);
            });
        })
    }

    async getPagination(connection, table, params, where, joins, body) {
        return new Promise((resolve, reject) => {
            let qry = `SELECT ${params} FROM ${table} ${joins ? joins : ''} WHERE 1=1 ${where} `;
            console.log(`[Pagination qry is] ::: `, qry);
            connection.query(qry, [params], function (err, results) {
                if (err) {
                    reject(err);
                }

                console.log(`[results] :::`, results);
                results = results[0];
                let total_page = Math.ceil(results.cnt / body.perPage);
                let obj = {
                    current_page: body.page,
                    next_page: body.page >= total_page ? body.page : +(body.page)+1,
                    privious_page: body.page <= 1 ? 1 : body.page-1,
                    per_page: body.perPage,
                    total_records: results.cnt
                }
                resolve(obj);
            });
        })
    }
}

module.exports = new DatabaseHelper();