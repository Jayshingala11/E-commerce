const Joi = require("joi");

class userValidator {

    async register(body) {
        return new Promise(async(resolve, reject) => {
            const schema = Joi.object({
                name: Joi.string().required(),
                email: Joi.string().email().required(),
                phone_number: Joi.string().min(10).max(10).required(),
                password: Joi.string().min(3).max(20).required(),
                age: Joi.string().required(),
                gender: Joi.string().required()
            })

            try{
                await schema.validateAsync(body);
                resolve();
            }
            catch(err) {
                console.log(`Not a valid object`);
                reject(err);
            }
        })
    }


    async login(body) {
        return new Promise(async(resolve, reject) => {
            const schema = Joi.object({
                email: Joi.string().email().required(),
                password: Joi.string().min(3).max(20).required()                
            })

            try{
                await schema.validateAsync(body);
                resolve();
            }
            catch(err) {
                console.log(`Not a valid object`);
                reject(err);
            }
        })
    }


    async product(body) {
        return new Promise(async(resolve, reject) => {
            const schema = Joi.object({
                category_id: Joi.number().required(),
                name: Joi.string().required(),
                price: Joi.number().required(),
                description: Joi.string().required(),
                images: Joi.any()
            })
            
            try{
                await schema.validateAsync(body);
                resolve();
            }
            catch(err) {
                console.log(`Not a valid Object`);
                reject(err);
            }
        })
    }


    // async getCart(body) {
    //     return new Promise((resolve, reject) => {
    //         const schema = Joi.object({
                
    //         })
    //     })
    // }


    async otp(body) {
        return new Promise(async(resolve, reject) => {
            const schema = Joi.object({
                number: Joi.string().min(10).max(10).required()
            })

            try {
                await schema.validateAsync(body);
                resolve();
            }
            catch(err) {
                console.log(`Not a valid Object`);
                reject(err);
            }
        })
    }


    async verifyOTP(body) {
        return new Promise(async(resolve, reject) => {
            const schema = Joi.object({
                number: Joi.string().min(10).max(10).required(),
                otp: Joi.string().min(4).max(4).required()
            })

            try {
                await schema.validateAsync(body);
                resolve();
            }
            catch(err) {
                console.log(`Not a valid Object`);
                reject(err);
            }
        })
    }
}


module.exports = new userValidator();