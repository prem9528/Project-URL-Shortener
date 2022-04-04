const UrlModel = require('../models/urlModel')
const ShortId = require('shortid') //nanoid


const isValid = function(value){
    if(typeof (value) == 'undefined' || value == null) return false
    if(typeof (value) == 'string' && value.trim().length > 0) return true    
}

const isValidRequest = function(object){
    return Object.keys(object).length > 0
}

const isValidUrl = function(value){
    let regexForUrl = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/
    return regexForUrl.test(value)
}

const urlShortener = async function(req, res){

    const requestBody = req.body
    const queryParams = req.query
   

    if(isValidRequest(queryParams)){
    return res.status(400).send({status : false, message : "invalid request"})    
    }

    if(!isValidRequest(requestBody)){
    return res.status(400).send({status : false, message : "data is required"})    
    }

    const longUrl = req.body.longUrl
    const base = "http://localhost:3000"

    
  
    if(!isValid(longUrl)){
    return res.status(400).send({status : false, message : "URL is required"}) 
    }

    if(Object.keys(requestBody).length > 1){
    return res.status(400).send({status : false, message : "invalid request"})    
    }

    if(!isValidUrl(longUrl)){
    return res.status(400).send({status : false, message : "Enter a valid URL"})   
    }

   
   let urlCode = ShortId.generate()

    try{
        const URL = await UrlModel.findOne({longUrl})

        if(URL){
            res.status(201).send({status : true, message : "url shorten successfully", data : URL })

        }else{
            const shortUrl = `${base}/${urlCode}`  

            const urlData = {
                urlCode : urlCode,
                longUrl : longUrl.trim(),
                shortUrl : shortUrl
            }

            const newUrl = await UrlModel.create(urlData)

            res.status(201).send({status : true, message : "url shorten successfully", data : newUrl })
        }

    }catch(err){
        res.status(500).send({error : err.message})
    }
}


const getUrl = async function(req, res){

    const requestBody = req.body
    const queryParams = req.query
   
try{
    if(isValidRequest(queryParams)){
    return res.status(400).send({status : false, message : "invalid request"})    
    }

    if(isValidRequest(requestBody)){
    return res.status(400).send({status : false, message : " input data is not required"})    
    }

    const urlCode = req.params.urlCode

    if(!urlCode){
    return res.status(400).send({status : false, message : " urlCode is required"}) 
    }

    const findUrlDetailsByCode = await UrlModel.findOne({urlCode : urlCode})

    
    if(!findUrlDetailsByCode){
    return res.status(404).send({status: false, message : "no such url exist"})
    }

    res.redirect(findUrlDetailsByCode.longUrl)
}catch(err){
    res.status(500).send({error : err.message})
}
}

module.exports.urlShortener = urlShortener
module.exports.getUrl = getUrl