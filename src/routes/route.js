const express = require('express')
const router = express.Router()
const UrlController = require('../controllers/urlController')

// test API
router.get('/test', function(req, res){
    res.send({status : true, message : "Test API working fine"})
})

// API for url shortening 
router.post('/url/shorten', UrlController.urlShortener )

// API for redirecting to original url
router.get('/:urlCode', UrlController.getUrl)



module.exports = router