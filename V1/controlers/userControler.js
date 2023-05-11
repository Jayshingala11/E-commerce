const { sendResponse } = require("../../utils/responseHelper");
const userValidator = require("../validators/userValidator");
const databaseHelper = require("../../utils/dbHelper");
const userHelper = require("../helpers/userHelper");
const authHelper = require("../helpers/authHelper");
const dbHelper = require("../../utils/dbHelper");
var _ = require('lodash');
const common = require("../../utils/common");
class UserControler {

    async register(req,res) {
        let connection = await databaseHelper.getConnection();
        let body = req.body;
        try{
            console.log(`Body is :::`, req.body);

            // user Register
            await userValidator.register(req.body);

            // user Email exist check 
            let Emialcheck = await userHelper.isuserExistbyEmail(connection, body);
            if(Emialcheck.length > 0) {
                throw {message: "Email already exist"};
            }
            console.log(`everything is okay, go ahead`);

            // user Password Hash 
            let passwordHash = await authHelper.genratePassword(body);
            body.password = passwordHash;

            console.log(`Final Body :::`, body);
            
            // insert body into DB
            await userHelper.userinsert(connection, body);

            sendResponse(res, 1, "success", {})
        }
        catch(err){
            console.log(`In login catch`, err);
            sendResponse(res, 0, err.message || "Error", err)
        }
        finally {
            databaseHelper.release(connection);
        }
    }


    async login(req,res) {
        let connection = await databaseHelper.getConnection();
        let body = req.body;
        try{
            console.log(`Body is :::`, req.body);

            await userValidator.login(req.body);

            //First check that email is exists or not...
            let isEmailExist = await databaseHelper.select(connection, `users`, ` * `, `AND email="${body.email}"`);
            console.log(`isEmailExist ::: `, isEmailExist);

            if(isEmailExist.length == 0 ) throw {message: "User doesn not exist. Please regsiter first."}

            //Check this user's status as well...
            if(isEmailExist[0].status == 0 ) throw {message: "User is blocked by admin."}

            //Now check that, Does user enters with correct password or not?
            let isPasswordCorrect = await authHelper.comparePassword(body, isEmailExist[0].password);
            console.log(`isPasswordCorrect ::: `, isPasswordCorrect);
            if(isPasswordCorrect == false) throw {message: "Incorrect email or password."}

            //Now all okay till here... So let's generate a new token for this user...
            let userObj = {
                id: isEmailExist[0].id,
                name: isEmailExist[0].name
            }

            //Now it's time to generate/issue a new token to this user...
            let token = await authHelper.generateToken(userObj, '1h');
            console.log(token);

            sendResponse(res, 1, "Login successfully", token);
        }
        catch(err){
            console.log(`In login catch`, err);
            sendResponse(res, 0, err.message || "Somthing went wrong", err)
        }
        finally {
            databaseHelper.release(connection);
        }
    }


    async profile(req,res) {
        let connection = await databaseHelper.getConnection();
        let body = req.body;
        try{
            console.log(`Body is profile :::`, body);
            let userData = await dbHelper.select(connection, `users`, ` * ` , ` AND id = ${body.user.id}`);
            sendResponse(res, 1, "Success", userData[0]);
        }
        catch(err){
            console.log(`In Profile catch`, err);
            sendResponse(res, 0, err.message || "Somthing went wrong", err)
        }
        finally {
            databaseHelper.release(connection);
        }
    }


    async product(req, res) {
        let connection = await databaseHelper.getConnection();
        let body = req.body;

        try{
            console.log(`[body :::]`, body);

            await userValidator.product(body);

            let insert = await userHelper.productInsert(connection, _.omit(body, 'images'));
            console.log(`[product_id] ::: `, insert.insertId);

            //Now Insert Images 
            console.log(`After filter :::`, body);
            console.log(`req.files :::`, req.files);

            // return;
            for(let i = 0 ; i < req.files.images.length; i++){
                await  userHelper.productImageInsert(connection, {product_id : insert.insertId, image: req.files.images[i].name});
            }

            sendResponse(res, 1, "Success", {});
        }
        catch(err) {
            console.log(`In Product catch`, err);
            sendResponse(res, 0, "Somthing went wrong", err);
        }
        finally {
            databaseHelper.release(connection);
        }
    }


    async productFetch(req, res) {
        let connection = await databaseHelper.getConnection();
        let body = req.body;
        
        try{
            console.log(`[body is :::]`, body);

            let where = ``;

            if('min_price' in body){
                where += ` AND pr.price >= ${body.min_price}`;
            }
            if('max_price' in body){
                where += ` AND pr.price <= ${body.max_price}`;
            }
            const startLimit = (body.page - 1) * body.perPage;
            let limit = ` LIMIT ${startLimit} , ${body.perPage} `;

            let fetchProduct = await databaseHelper.select(connection, `product as pr`, `pr.*`, `${where} ${limit}`);
            console.log(`FetchProduct :::`, fetchProduct);
            let images = await databaseHelper.select(connection, `product_images`, `id, image, product_id `,`AND product_id IN (${fetchProduct.map(x => x.id)})`);
            let length = fetchProduct.length;
            for(let i = 0; i < length; i++) {
                fetchProduct[i].images = images.filter(x => x.product_id == fetchProduct[i].id);
            }

            let pagination = await databaseHelper.getPagination(connection, 'product as pr', ' COUNT(id) as cnt ', where, null, body);
            let resData ={
                data: fetchProduct,
                pagination: pagination
            }

            sendResponse(res, 1, 'Success', resData);

        }
        catch(err){
            console.log(`In productFetch catch`, err);
            sendResponse(res, 0, "Somthing went wrong", err);
        }
        finally{
            databaseHelper.release(connection);
        }
    }



    async getCart(req, res) {
        let connection = await databaseHelper.getConnection();
        let body = req.body;

        try{
            console.log(`[body] :::`, body);
            let select = ` cd.cart_id, cd.inventory_id, cd.qty as order_qty, inv.product_id, pr.name, pr.price, ca.user_id, ur.name   `;
            let cart_details = await databaseHelper.select(connection, `cart_details as cd`, select, '' , common.getJoins([1,2,3,4]));
            let images = await databaseHelper.select(connection, `product_images`, `id, CONCAT('https://www.amazon.com/bucketname/',image) as image, product_id`, `AND product_id IN (${cart_details.map(x => x.product_id)})`);

            let length = cart_details.length;
            console.log(`Length :::`, length);
            for(let i = 0; i < length; i++) {
                cart_details[i].image = images.filter(x => x.product_id == cart_details[i].product_id)
            }            
            sendResponse(res, 1, "Success", cart_details);
        }
        catch(err) {
            console.log(`In getCart catch :::`, err);
            sendResponse(res, 0, "Somthing went wrong", err);
        }
        finally {
            databaseHelper.release(connection);
        }
    }



    async otp(req, res) {
        let body = req.body;
        try {
            console.log(`[body is] :::`, body);

            await userValidator.otp(body);

            let otpGenerate = await authHelper.otpGenerator();
            console.log(`[OTP is] :::`, otpGenerate);

            
        }
        catch(err) {
            console.log(`In otp catch`, err);
            sendResponse(res, 0, "Somthing went wrong");
        }
    }
}


module.exports = new UserControler();