const express = require("express")
const cors = require('cors')
const bodyParser = require('body-parser')
const app = express()
const serveStatic = require('serve-static')
const port = process.env.PORT || 8080
const path = require('path');
const fs = require('fs');
const https = require('https');
app.use(bodyParser.json())
app.use(cors())
app.use(
  bodyParser.urlencoded({
    extended: false
  })
)

var Users = require('./routes/Users')
app.use('/users', Users)

var Program = require('./routes/Program')
app.use('/program', Program)

var Email = require('./routes/Email')
app.use('/service', Email)

var Customer = require('./routes/Customers')
app.use('/customers', Customer)

var Schedule = require('./routes/Schedule')
app.use('/schedule', Schedule)

var Reservation = require('./routes/Reservation')
app.use('/reservation', Reservation)

var Payment = require('./routes/Payment')
app.use('/payment', Payment)

var Report = require('./routes/Report')
app.use('/report', Report)

var NodeSchedule = require('./routes/Node-Schedule')
app.use('/node-schedule', NodeSchedule)

// Folder for photo
app.use(express.static('public'));

/************** Set static folder for deploy folder **************/
app.use(express.static(__dirname + '/dist/client'));
app.get('/*', function(req, res) {
  res.sendFile(path.join(__dirname + '/dist/client/index.html'))
});

/*****************************************************************/

/************* HTTPS SERVER *************/
// OPENSSL to create key 
// openssl genrsa -out server-key.pem 1024
// openssl req -new -key server-key.pem -out server-csr.pem
// openssl x509 -req -in server-csr.pem -signkey server-key.pem -out server-cert.pem

// https.createServer({
//   key: fs.readFileSync('./server-key.pem'),
//   cert: fs.readFileSync('./server-cert.pem')
// }, app)
// .listen(8080, function () {
//  console.log('Example app listening on port 3000! Go to https://localhost:8080/')
// })

/**************************************/

app.listen(port , () =>{
  console.log("Server started on port 3000");
});

