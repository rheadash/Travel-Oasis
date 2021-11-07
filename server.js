var express = require('express')
var ejs = require('ejs')
var path = require('path')
var app = express()
var bodyParser = require('body-parser')
var session = require('express-session')

app.use(
	session({
		secret: 'work hard',
		resave: true,
		saveUninitialized: false,
	})
)

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use(express.static(__dirname + '/views'))
// Serve images from /uploads
app.use('/uploads', express.static('./uploads'))

var index = require('./routes/index')
app.use('/', index)

// catch 404 and forward to error handler
app.use((req, res, next) => {
	var err = new Error('File Not Found')
	err.status = 404
	next(err)
})

// error handler
// define as the last app.use callback
app.use((err, req, res, next) => {
	res.status(err.status || 500)
	res.send(err.message)
})

// listen on port 3001
app.listen(3001, () => {
	console.log('Express app listening on port 3001')
})
