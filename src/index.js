const express = require ('express')
const bodyParser = require('body-parser')
const app = express()
const route = require('../src/routes/route')
const mongoose = require('mongoose')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))


mongoose.connect("mongodb+srv://surajxxx:MetEma4V1FgQslG7@cluster0.ik33b.mongodb.net/Project-Url-Shortener-DB?retryWrites=true&w=majority", {
    useNewUrlParser: true
})
.then( () => console.log("MongoDb is connected"))
.catch ( err => console.log(err) )

app.use('/' , route)

app.listen(process.env.PORT || 3000, function(){
    console.log("Express app running on PORT" + (process.env.PORT || 3000))
})