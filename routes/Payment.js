const express = require("express");
const cors = require("cors");
const payment = express.Router();
const bodyParser = require("body-parser");

const path = require("path");
const stripe = require("stripe")(process.env.STRIPE_SKEY);
const Payment = require("../models/Payment");
const ReservationHeader = require("../models/ReservationHeader");
const Refund = require("../models/Refund");

payment.use(bodyParser.json());         // to support JSON-encoded bodies
payment.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 
payment.use(cors());


/******************************************
 *            MAKE A CHARGE               *
 ******************************************/
payment.post("/pay", (req, res) => {
  var stripeToken = req.body.token;
  var amount = req.body.amount;
  var email = req.body.email;

  // The unit of money send to Stripe will need to multiple by 100
  stripe.charges
    .create({
      amount: amount * 100,
      currency: "usd",
      description: req.body.description,
      receipt_email: "tonyhuy007@gmail.com",
      source: stripeToken.id,
    })
    .then((result) => {
      console.log("Charge Successful");
      res.json(result);
    })
    .catch((err) => {
      console.log(err + " Charge Fail");
      res.status(500).end();
    });
});

/******************************************
 *        ISSUE A REFUND                  *
 ******************************************/
payment.post("/refund", (req, res) => {
   // The unit of money send to Stripe will need to multiple by 100
  var refund = req.body.amount * 100;       
  var chargeToken = req.body.token;

  stripe.refunds
    .create({
      charge: chargeToken,
      amount: refund,
    })
    .then((result) => {
      console.log("Refund Successful");
      
      // Update PaymentPK IsRefund Status
      Payment.findOne({
        where: {
          ChargeToken: chargeToken
        },
      })
        .then((paid) => {
          if (paid) {
            paid.update({
              IsRefund: true
            });
          }
        })
        .catch((err) => {
          res.send("error: " + err + "   " + req.params.id);
        });
      res.json(result);
    })
    .catch((err) => {
      console.log(err + " Charge Fail");
      res.status(500).end();
    });
});

/******************************************
 *       CREATE NEW REFUND DATA          *
 ******************************************/
payment.post("/create-refund", (req, res) => {
  Refund.create(req.body)
    .then((result) => {
      res.json(result);
    })
    .catch((err) => {
      res.send("err Create Refund Data " + err);
    });
});


/******************************************
 *       CREATE NEW PAYMENT DATA          *
 ******************************************/
payment.post("/create-payment", (req, res) => {
  Payment.create(req.body)
    .then((result) => {
      res.json(result);
    })
    .catch((err) => {
      res.send("err Create Payment Data " + err);
    });
});

/******************************************
 *       UPDATE PAYMENT DATA              *
 ******************************************/
payment.put("/update-payment/:id", (req, res) => {
  Payment.findOne({
    where: {
      PaymentPK: req.params.id,
    },
  })
    .then((result) => {
      result.update(req.body).catch((err) => {
        res.send("err Update Payment Data " + err);
      });
    })
    .catch((err) => {
      res.send("err There is no payment data." + err);
    });
});

/******************************************
 *          GET PAYMENT BY ID             *
 ******************************************/
payment.get("/get-payment-by-id/:id", (req, res) => {
  Payment.findOne({
    where: {
      PaymentPK: req.params.id,
    },
  })
    .then((result) => {
      if (result) {
        res.json(result);
      } else {
        res.send("There is no payment data.");
      }
    })
    .catch((err) => {
      res.send("error: " + err + "   " + req.params.id);
    });
});

/******************************************
 *          GET PAYMENT BY USERPK         *
 ******************************************/
payment.get("/get-payment-by-user/:id", (req, res) => {
  Payment.findAll({
    where: {
      UserPK: req.params.id,
    },
  })
    .then((result) => {
      if (result) {
        res.json(result);
      } else {
        res.send("There is no payment data.");
      }
    })
    .catch((err) => {
      res.send("error: " + err + "   " + req.params.id);
    });
});

/******************************************
      GET REFUNDABLE PAYMENT BY RESERVATION   
 ******************************************/
payment.get("/get-payment-by-reservation/:id", (req, res) => {
  Payment.findAll({
    where: {
      ReservationPK:  req.params.id,
      PaymentType: process.env.PAYMENT_TYPE_CODE_CARD,
      IsRefund: false
    },
  })
    .then((result) => {
      if (result) {
        res.json(result);
      } else {
        res.send("There is no payment data.");
      }
    })
    .catch((err) => {
      res.send("error: " + err + "   " + req.params.id);
    });
});


/******************************************
      GET ALL PAYMENT BY RESERVATION   
 ******************************************/
payment.get("/get-all-payment-by-reservation/:id", (req, res) => {
  Payment.findAll({
    where: {
      ReservationPK:  req.params.id
    },
  })
    .then((result) => {
      if (result) {
        res.json(result);
      } else {
        res.send("There is no payment data.");
      }
    })
    .catch((err) => {
      res.send("error: " + err + "   " + req.params.id);
    });
});


/******************************************
   CALCULATE REFUND AMOUNT BY RESERVATION   
 ******************************************/
payment.get("/get-refund-amount-by-reservation/:id", (req, res) => {
  Refund.findAll({
    where: {
      ReservationPK:  req.params.id
    },
  })
    .then((result) => {
      if (result) {
        let sumTotal = 0;
        result.forEach(element => {
          sumTotal += element.Amount;
        });
        // Divide by 100 to display the Amount on UI
        res.json(sumTotal / 100);
      } else {
        res.send("There is no refund data.");
      }
    })
    .catch((err) => {
      res.send("error: " + err + "   " + req.params.id);
    });
});




module.exports = payment;
