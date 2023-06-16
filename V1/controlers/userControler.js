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

            if(isEmailExist.length == 0 ) throw {message: "User does not exist. Please regsiter first."}

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
        let connection = await databaseHelper.getConnection();
        let body = req.body;
        try {
            console.log(`[body is] :::`, body);

            await userValidator.otp(body);

            // OTP Generate
            let otpGenerate = await authHelper.otpGenerator();
            console.log(`[OTP is] :::`, otpGenerate);

            let Obj = {
                number: body.number,
                otp: otpGenerate
            }
            console.log(`[Object is] :::`, Obj);

            // Check Number is Exist or Not in DB...
            let numberFetch = await databaseHelper.select(connection, `user_number as un`, `un.number`, `AND number IN (${body.number})`);
            
            // Update this OTP in DB with this number...
            if(numberFetch.length > 0) {
                let update = await userHelper.otpUpdate(connection,{otp: otpGenerate}, `number = '${body.number}' `);
                console.log(`[update] :::`, update);
            }
            // Insert new Number with OTP in DB...
            else {
                let insert = await userHelper.otpInsert(connection, Obj);   
                console.log(`[insert] :::`, insert);
            }

            sendResponse(res, 1, "Otp send successfully", otpGenerate);
            
        }
        catch(err) {
            console.log(`In otp catch`, err);
            sendResponse(res, 0, "Somthing went wrong");
        }
        finally {
            databaseHelper.release(connection);
        }
    }


    async verifyOTP(req, res) {
        let connection = await databaseHelper.getConnection();
        let body = req.body;

        try{
            console.log(`[Body is] :::`, body);

            await userValidator.verifyOTP(body);

            // Check Number & OTP in DB available or Not...
            let verify = await databaseHelper.select(connection, `user_number as un`, `un.*`, `AND number = ${body.number} AND otp = ${body.otp}`);
            console.log(`[verify] :::`, verify);

            // If Number OR OTP not Match to DB Then Throw Err...
            if(verify.length === 0) throw {message: "Please Enter a valid Number OR OTP..."}; 
            
            // Now it's time to generate/issue a new token to this user...
            let token = await authHelper.generateToken(body.otp, '1h');
            console.log(`[Token ] :::`, token);

            sendResponse(res, 1, "Login successfully", token);
        }
        catch(err) {
            console.log(`In verifyOTP catch`, err);
            sendResponse(res, 0, "Somthing went wrong", err);
        }
        finally {
            databaseHelper.release(connection);
        }
    }


    async itemFetch(req, res) {
        let connection = await databaseHelper.getConnection();
        let body = req.body;

        try {

            console.log(`[Body is ] :::`, body);

            let where = '';

            if(`min_price` in body) {
                where += ` AND pr.price >= ${body.min_price} `;
            }
            if(`max_price` in body) {
                where += ` AND pr.price <= ${body.max_price} `;
            }

            let itemFetch = await databaseHelper.select(connection, `products as pr`, `*`, `${where}`);
            console.log(`[Item Fetch ] :::`, itemFetch);

            sendResponse(res, 1, "Success", itemFetch);
        }
        catch(err) {
            console.log(` In itemFetch catch `, err);
            sendResponse(res, 0, " Somthing went wrong ", err);
        }
        finally {
            databaseHelper.release(connection);
        }
    }


    async itemDelete(req, res) {
        let connection = await databaseHelper.getConnection();
        
        try {

            await databaseHelper.delete(connection, `products`, `AND id = 4`);
            
            sendResponse(res, 1, "Success", null);
        }
        catch(err) {
            console.log(` In itemDelete catch `, err);
            sendResponse(res, 0, "Somthing went wrong", err);
        }
        finally {
            databaseHelper.release(connection);
        }
    }



    async checkIn(req, res) {
        let connection = await dbHelper.getConnection();
        let body = req.body;

        try{

            console.log(`[Body is ] :::`, body);

            await userValidator.checkIn(body);

            let checkEmpId = await dbHelper.select(connection, `check_in_time`, `*`, `AND employe_id = "${body.employe_id}"`);
            console.log(`[Employe data] :::`, checkEmpId);

            if(checkEmpId.length != 0) {
                throw {message: "You are already Check-In"};
            }else{
                let insertEmp = await dbHelper.insert(connection, `check_in_time`, body);
                console.log(`[insertEmp] :::`, insertEmp);
            }

            sendResponse(res, 1, "Success", body);
        }
        catch(err) {
            console.log(`In checkIn catch`, err);
            sendResponse(res, 0, err.message || "Somthing went wrong", err);
        }
        finally{
            dbHelper.release(connection);
        }
    }


    async checkOut(req, res) {
        let connection = await dbHelper.getConnection();
        let body = req.body;

        try{
            console.log(`[Body is ] :::`, body);

            await userValidator.checkOut(body);

            let checkEmp = await dbHelper.select(connection, `check_in_time`, `*`, `AND employe_id = "${body.employe_id}"`);

            if(checkEmp[0].employe_id == body.employe_id && checkEmp[0].check_out_time != "00:00:00") {
                throw {message: "You are already Check-Out"};
            }else{
                let updateEmpOutTime = await userHelper.check_out_time_Update(connection, {check_out_time: body.check_out_time}, `employe_id = "${body.employe_id}"`);
            }

            sendResponse(res, 1, "Success", body);
        }
        catch(err) {
            console.log(`In checkOut catch`, err);
            sendResponse(res, 0, err.message || "Somthing went wrong", err);
        }
        finally{
            dbHelper.release(connection);
        }
    }


    async getData(req, res) {
        let connection = await databaseHelper.getConnection();
        let body = req.body;

        try{
            console.log(`[body] :::`, body);

            await userValidator.getData(body);

            let checkStatus = await databaseHelper.select(connection, `check_in_time`, `*`, `AND employe_id = "${body.employe_id}"`);

            if(checkStatus[0].check_out_time == "00:00:00" && checkStatus[0].check_in_time != 0) {
                sendResponse(res, 1, {Check_in_status: 2, Check_out_status: 1}, checkStatus);
            }
            else if(checkStatus[0].check_out_time != "00:00:00" && checkStatus[0].check_in_time != 0) {
                sendResponse(res, 1, {Check_in_status: 2, Check_out_status: 2}, checkStatus);
            }

        }
        catch(err) {
            console.log(`In getdata catch`, err);
            sendResponse(res, 0, err.message || "Somthing went wrong", err);
        }
        finally{
            databaseHelper.release(connection);
        }
    }


    async deleteData(req, res) {
        let connection = await databaseHelper.getConnection();
        let body = req.body;

        try{
            console.log(`[Body] :::`, body);

            await userValidator.deleteData(body);

            let deleteEmp = await databaseHelper.delete(connection, `check_in_time`, `AND employe_id = "${body.employe_id}"`);


            sendResponse(res, 1, "Deleted Successfully", body);
        }
        catch(err) {
            console.log(`In deleteData catch`, err);
            sendResponse(res, 0, err.message || "Somthing went wrong", err);
        }
        finally{
            databaseHelper.release(connection);
        }
    }
}


module.exports = new UserControler();