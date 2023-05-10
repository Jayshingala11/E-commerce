class ResponseHelper {
    
    sendResponse(res, code, message, data) {
        res.send({
            code, message, data
        });
    } 
}

module.exports = new ResponseHelper();