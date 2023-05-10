const databaseHelper = require("../../utils/dbHelper");

class userHelper {

    async isuserExistbyEmail(connection, body) {
        let emailcheck = await databaseHelper.select(connection, `users`, `*`, `AND email="${body.email}"`);
        return emailcheck;
    }


    async userinsert(connection, body) {
        let userinsert = await databaseHelper.insert(connection, 'users', body);
        return userinsert;
    }

    async productInsert(connection, body) {
        console.log(`Boday 1 ::: `,body);
        let productInsert = await databaseHelper.insert(connection, `product`, body);
        return productInsert;
    }


    async productImageInsert(connection, body) {        
        let productInsert = await databaseHelper.insert(connection, `product_images`, body);
        return productInsert;
    }
}


module.exports = new userHelper();