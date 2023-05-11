var jwt = require('jsonwebtoken');
const secret = "DHJWKJSBVKDISDBVJEWJSDHJDSHFJLSDHVJEWBGJDSUIEBF13UHUEUFHWE18HUEWHUE83HDODJVJXZ";
const bcrypt = require('bcrypt');
const saltRounds = 10;
const otpGenerator = require('otp-generator')


class authHelper {
    
    async generateToken(body, expiresIn){
        return new Promise((resolve, reject) =>{
            let token = jwt.sign({
                data: body
              }, secret, { expiresIn: expiresIn });
            
              resolve(token);
        });
    }


    //Middleware...
    async verifyToken(req, res, next) {
        console.log(`[Header is ::: ]`, req.headers.token);
        return new Promise((resolve, reject) => {
            jwt.verify(req.headers.token, secret, function(err, decoded) {
                if(err) {
                    console.log(`[Decode err ::: ]`,err); 
                    reject({message: "Your Token Expire"});
                }
                console.log(`[Decode is ::: ]`,decoded);
                req.body.user = decoded.data; 
                next();
              });   
        })
    }

    async genratePassword(body) {
        return new Promise((resolve, reject) =>{
            bcrypt.hash(body.password, saltRounds, function(err, hash) {
                // Store hash in your password DB.
                console.log(`password hash :::`, hash);
                resolve(hash);
            });
        })
       
    }

    async comparePassword(body, hash){
        return new Promise((resolve, reject) =>{
            bcrypt.compare(body.password, hash, function(err, result) {
                resolve(result);
            }); 
        })
    }


    async otpGenerator() {
        let otp = otpGenerator.generate(4, {digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false});
        return otp;
    }
}


module.exports = new authHelper();