require('dotenv').config();
const express = require("express");
// const cors = require("cors");
const reservation = express.Router();
const bodyParser = require("body-parser");

const ReservationHeader = require("../models/ReservationHeader");
const ReservationGroupDetails = require("../models/ReservationGroupDetails");
const ReservationIndividualDetails = require("../models/ReservationIndividualDetails");
const MarketingInfo = require("../models/MarketingInformation");
const Payment = require("../models/Payment");
const Schedule = require("../models/Schedule");

reservation.use(bodyParser.json());         // to support JSON-encoded bodies
reservation.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

//Define node-mailer
const emailService = require('./Email');

//Define veriable for Sequelize database
const db = require('../db');
const Sequelize = db.sequelize;
const Op = Sequelize.Op;

reservation.use(bodyParser.json());
// reservation.use(cors());

/******************************************
 *       GET ALL RESERVATION HEADER           *
 ******************************************/
reservation.get("/get-all-reservation", (req, res) => {
  ReservationHeader
    .findAll({
      where: {
        IsActive: true,
      },
    })
    .then((result) => {
      if (result) {
        res.json(result);
      } else {
        res.send("There is no reservation available.");
      }
    })
    .catch((err) => {
      res.send("error: Get Reservation" + err);
    });
});

/******************************************
 *  GET ALL RESERVATION HEADER BY USER PK *
 ******************************************/
reservation.get("/get-all-reservation-by-userpk/:userpk", (req, res) => {
  ReservationHeader
    .findAll({
      where: {
        UserPk: req.params.userpk,
        IsActive: true,
      },
    })
    .then((result) => {
      if (result) {
        res.json(result);
      } else {
        res.send("There is no reservation available.");
      }
    })
    .catch((err) => {
      res.send("error: Get Reservation" + err);
    });
});

/******************************************
 *  GET ALL ACTIVE RESERVATION HEADER BY SCHEDULE PK *
 ******************************************/
reservation.get("/get-all-reservation-by-schedulepk/:schedulepk", (req, res) => {  
  getReservationBySchedulePK(req.params.schedulepk, returnInfo =>{
    res.json(returnInfo.result)
  })  
});

//Define this function to reuse for other HTTP request
async function getReservationBySchedulePK(schedulepk, callback){
  ReservationHeader
  .findAll({
    where: {
      Schedulepk: schedulepk,
      IsActive: true,
      ReservationStatus: 1 //On-going
    },
  })
  .then((allReservationHeader) => {
    if (allReservationHeader.length > 0) {
      callback({result: allReservationHeader});
    } else {
      callback({error: "There is no reservation available."});
    }
  })
  .catch((err) => {
      callback("error: Get Reservation" + err);
      });  
}

/***********************************************************
 *  GET ALL RESERVATION DETAILS FOR RESERVATION MANAGEMENT (FOR ADMIN DASHBOARD)
 * It will return an object from ReservationHeader table, Reservationdetails table,
 * Schedule table, User detail table, Program table, and Payment table
 ***********************************************************/
reservation.get("/get-all-reservation-details-for-reservation-management", (req, res) => {  
  var query = `SELECT  reservationheader.*, schedule.Start, schedule.End, userdetails.FirstName, 
                userdetails.LastName, users.Email, program.Name, program.ProgramType, schedule.SessionDetailsPK
              FROM pmmc.reservationheader
                INNER JOIN pmmc.schedule on schedule.SchedulePK = reservationheader.SchedulePK
                INNER JOIN pmmc.users on reservationheader.UserPK = users.UserPK
                INNER JOIN pmmc.userdetails on reservationheader.UserPK = userdetails.UserPK
                INNER JOIN pmmc.program on schedule.ProgramPK = program.ProgramPK
              ORDER BY schedule.Start desc, reservationheader.ReservationStatus`;
    Sequelize.query(query,{ 
        type: Sequelize.QueryTypes.SELECT})
    .then(reservationInfo =>{
      res.json(reservationInfo);
    })
});

/***********************************************************
 *  GET ALL RESERVATION DETAILS FOR RESERVATION MANAGEMENT BY USERPK (FOR CUSTOMER DASHBOARD)
 * It will return an object from ReservationHeader table, Reservationdetails table,
 * Schedule table, User detail table, Program table, and Payment table
 ***********************************************************/
reservation.get("/get-all-reservation-details-for-reservation-management-by-userpk/:id", (req, res) => {  
  var query = `SELECT  reservationheader.*, schedule.Start, schedule.End, userdetails.FirstName, 
                userdetails.LastName, users.Email, program.Name, program.ProgramType, schedule.SessionDetailsPK
              FROM pmmc.reservationheader
                INNER JOIN pmmc.schedule on schedule.SchedulePK = reservationheader.SchedulePK
                INNER JOIN pmmc.users on reservationheader.UserPK = users.UserPK
                INNER JOIN pmmc.userdetails on reservationheader.UserPK = userdetails.UserPK
                INNER JOIN pmmc.program on schedule.ProgramPK = program.ProgramPK
              WHERE reservationheader.UserPK = (:UserPK)
              ORDER BY schedule.Start desc, reservationheader.ReservationStatus`;
    Sequelize.query(query,{
        replacements: {
          UserPK: req.params.id
        }, 
        type: Sequelize.QueryTypes.SELECT})
    .then(reservationInfo =>{
      res.json(reservationInfo);
    })
});

/***********************************************************
 *  GET RESERVATION HEADER BY PROGRAMPK (FOR VIEW RESERVATION DETAILS)
 ***********************************************************/
reservation.get("/get-reservation-header-by-reservationpk/:id", (req, res) => {  
  ReservationHeader.findOne({
    where:{
      ReservationPK: req.params.id
    }
  })
  .then(reservationInfo =>{
    res.json(reservationInfo);
  })
});


/***********************************************************
 *  GET ALL ACTIVE RESERVATION DETAILS FOR VIEW SCHEDULE
 ***********************************************************/
reservation.get("/get-all-reservation-details-for-view-schedule/:schedulepk/:programpk/:type", (req, res) => {  
  getReservationBySchedulePK(req.params.schedulepk, returnInfo =>{    
    if(returnInfo.result){      
      //Get the array of all ReservationPK
      let reservationPKArr = []
      returnInfo.result.forEach(item =>{
        reservationPKArr.push(item.ReservationPK)
      })
      //Get all reservation details by ReservationPK
      switch(req.params.type){
        case "0": //group
            ReservationGroupDetails.findAll({
              where:{
                ReservationPK: {[Op.in]: reservationPKArr}
              }
            })
            .then(groupDetails =>{
              if(groupDetails.length > 0){
                res.json(groupDetails)
              }
              else{
                res.json({error: "There is no group reservation details."})
              }            
            })
            break;

        case "1": //individual
            ReservationIndividualDetails.findAll({
              where:{
                ReservationPK: {[Op.in]: reservationPKArr}
              }
            })
            .then(individualDetails =>{
              if(individualDetails.length > 0){
                res.json(individualDetails)
              }
              else{
                res.json({error: "There is no indidivual reservation details."})
              }            
            })
            break;
      }      
    }
    else{
      res.send(returnInfo)
    }
  })  
});

/******************************************
 *       CREATE NEW RESERVATION HEADER    *
 ******************************************/
reservation.post("/add-new-reservation", (req, res) => {
  const today = new Date();
  ReservationHeader.create(req.body)
    .then((result) => {
      res.json(result.ReservationPK);
    })
    .catch((err) => {
      res.send("err Add reservation " + err);
    });
});

/******************************************
 *  CREATE NEW GROUP RESERVATION DETAILS  *
 ******************************************/
reservation.post("/add-group-reservation-details", (req, res) => {
  ReservationGroupDetails.create(req.body)
    .then((result) => {
      res.json(result);
    })
    .catch((err) => {
      res.send("err Add reservation " + err);
    });
});

/******************************************
 *  GET GROUP RESERVATION DETAILS BY RESERVATIONPK *
 ******************************************/
reservation.get("/get-group-reservation-details-by-reservationpk/:id", (req, res) => {
  ReservationGroupDetails.findOne({
    where:{
      ReservationPK: req.params.id
    }
  })
  .then(reservationInfo =>{
    res.json(reservationInfo);
  })
});

/*************************************************
 *  CREATE NEW INDIVIDUAL RESERVATION DETAILS      *
 **************************************************/
reservation.post("/add-individual-reservation-details", (req, res) => {
  ReservationIndividualDetails.create(req.body)
    .then((result) => {
      res.json(result);
    })
    .catch((err) => {
      res.send("err Add reservation " + err);
    });
});

/******************************************
 *  GET GROUP RESERVATION DETAILS BY RESERVATIONPK *
 ******************************************/
reservation.get("/get-individual-reservation-details-by-reservationpk/:id", (req, res) => {
  ReservationIndividualDetails.findOne({
    where:{
      ReservationPK: req.params.id
    }
  })
  .then(reservationInfo =>{
    res.json(reservationInfo);
  })
});

/******************************************
 *  GET PAYMENT INFO BY RESERVATIONPK *
 ******************************************/
reservation.get("/get-payment-info-by-reservationpk/:id", (req, res) => {
  Payment.findOne({
    where:{
      ReservationPK: req.params.id
    }
  })
  .then(reservationInfo =>{
    res.json(reservationInfo);
  })
});

/******************************************
      UPDATE REMAINING BALANCE    
 ******************************************/
reservation.put("/update-balance/:id", (req, res) => {
  var balance = req.body.value
  ReservationHeader.findOne({
    where :{
      ReservationPK: req.params.id 
    }
    })
    .then((result) => {
      result.update({
        RemainingBalance: balance
      })
      .then(result =>{
        if (result) {
          res.send({
           message: "REMAINING BALANCE has been changed."
          });
        }
        else {
          res.send({
           error: "Cannot update REMAINING BALANCE."
          });
        }
      })
    })
    .catch(err => {
      res.send("error: " + err);
    });
});

/*************************************************
 *         CREATE NEW MARKETING INFORMATION      *
 **************************************************/
reservation.post("/create-new-marketing", (req, res) => {
  const inputData = {
    MarketingPK: req.body.MarketingPK,
    ProgramPK: req.body.ProgramPK,
    UserPK: req.body.UserPK,
    MarketingContentPK: req.body.MarketingContentPK,
    Memo: req.body.Memo
  };

  MarketingInfo.create(inputData)
    .then((result) => {
      res.json(result);
    })
    .catch((err) => {
      res.send("err Create new marketing information " + err);
    });
});



/*************************************************
 *         ACCEPT PENDING RESERVATION            *
 *************************************************/
reservation.post("/accept-pending-reservation", (req, res) => {
  ReservationHeader.findOne({
    where :{
      ReservationPK: req.body.ReservationPK
    }
    })
    .then((result) => {
      if(result) {
        result.update({
          ReservationStatus: process.env.RESERVATION_STATUS_CODE_ON_GOING
        })
        .then(result =>{
          if (result) {
            res.send({
             message: "ReservationStatus has been changed."
            });
          }
          else {
            res.send({
             error: "Cannot update ReservationStatus."
            });
          }
        })
      } else {
        res.send({
          error:  req.body.ReservationPK + "There is no ReservationHeader."
         });
      }
    })
    .catch(err => {
      res.send("error: " + err);
    });
});


/*************************************************
 *         CANCEL PENDING RESERVATION            *
 *************************************************/
reservation.post("/cancel-pending-reservation", (req, res) => {
  ReservationHeader.findOne({
    where :{
      ReservationPK: req.body.ReservationPK
    }
    })
    .then((result) => {
      if(result) {
        result.update({
          ReservationStatus: process.env.RESERVATION_STATUS_CODE_CANCELLED,
          IsActive: false
        })
        .then(result =>{
          if (result) {
            res.send({
             message: "ReservationStatus has been changed."
            });
          }
          else {
            res.send({
             error: "Cannot update ReservationStatus."
            });
          }
        })
      } else {
        res.send({
          error:  req.body.ReservationPK + "There is no ReservationHeader."
         });
      }
    })
    .catch(err => {
      res.send("error: " + err);
    });
});

/**********************************************************
 * ADMIN/CUSTOMER DASHBOARD - CANCEL CURRENT RESERVATION  *
 **********************************************************/
reservation.post("/cancel-current-reservation", (req, res) => {
  //Update record in reservationheader table (status to canceled, isactive to false)
  ReservationHeader.update({
    ReservationStatus: process.env.RESERVATION_STATUS_CODE_CANCELLED,
    IsActive: false
  },{
    where:{
      ReservationPK: req.body.ReservationPK
    }
  })
  .then(result =>{
    if(result == 1){
      //Find the record in schedule table 
      
      Schedule.findOne({
        where: {
          SchedulePK: req.body.SchedulePK
        }
      })
      .then(schedule =>{
        //Deduct schedule's CurrentNumberParticipant by the Number of Participant of reservation
        //(if IsFull is true, fix to false)
        Schedule.update({
          CurrentNumberParticipant: schedule.CurrentNumberParticipant - req.body.NumberOfParticipant,
          IsFull: false
        },{
          where:{
            SchedulePK: req.body.SchedulePK
          }
        })
        .then(result =>{
          if(result == 1){           
            var emailObject = {
              Start: schedule.Start,
              End: schedule.End,
              ProgramName: req.body.ProgramName,
              mode: req.body.mode,
              reasonCancel: req.body.reasonCancel,
              EmailList: [req.body.Email]
            };
            // emailService.sendEmailReservationCancelation(emailObject, info => {
            //     console.log(`The mail has been sent 😃 and the id is ${info.messageId}`);
            //     res.send({message: "Schedule and reservation has been updated"})
            //   });            
              res.send({message: "Schedule and reservation has been updated"})
          }
          else{
            res.send({message: "Cannot update schedule and reservation"})
          }
        })
      })      
      
    }
    else{
      res.send({message: "Cannnot find the reservationPK " + req.body.ReservationPK})
    }
  })
  .catch(err => {
    res.send("error: " + err);
  });

});



/********************************************************
      UPDATE PARTICIPANT QUANTITY RESERVATION HEADER 
 ********************************************************/
reservation.post("/update-quantity-header", (req, res) => {
  var reservationPK = req.body.ReservationPK;

  ReservationHeader.findOne({
    where :{
      ReservationPK: reservationPK 
    }
    })
    .then((result) => {
      result.update({
        NumberOfParticipant: req.body.NumberOfParticipant,
        Total : req.body.Total
      })
      .then(result =>{
        if (result) {
          res.send({
           message: "RESERVATION HEADER has been changed."
          });
        }
        else {
          res.send({
           error: "Cannot update RESERVATION HEADER."
          });
        }
      })
    })
    .catch(err => {
      res.send("error: " + err);
    });
});


/**************************************************
      UPDATE PARTICIPANT QUANTITY GROUP DETAILS 
 **************************************************/
reservation.post("/update-participant-quantity", (req, res) => {
  var reservationPK = req.body.ReservationPK;

  // Update Reservation Details.
  ReservationGroupDetails.findOne({
    where :{
      ReservationPK: reservationPK 
    }
    })
    .then((result) => {
      result.update({
        AdultQuantity: req.body.AdultQuantity,
        Age57Quantity: req.body.Age57Quantity,
        Age810Quantity: req.body.Age810Quantity,
        Age1112Quantity: req.body.Age1112Quantity,
        Age1314Quantity: req.body.Age1314Quantity,
        Age1415Quantity: req.body.Age1415Quantity,
        Age1517Quantity: req.body.Age1517Quantity,
        TotalQuantity: req.body.TotalQuantity
      })
      .then(result =>{
        if (result) {
          res.send({
           message: "Participant Quantity has been changed."
          });
        }
        else {
          res.send({
           error: "Cannot update Participant Quantity."
          });
        }
      })
    })
    .catch(err => {
      res.send("error: " + err);
    });
});


/************************************************
*         UPDATE RESERVATION STATUS             *
*************************************************/
reservation.post("/update-reservation-status/:id", (req, res) => {
  ReservationHeader.findOne({
    where :{
      ReservationPK: req.params.id
    }
    })
    .then((result) => {
      if(result) {
        result.update({
          ReservationStatus: req.body.ReservationStatus
        })
        .then(result =>{
          if (result) {
            res.send({
             message: "ReservationStatus has been changed."
            });
          }
          else {
            res.send({
             error: "Cannot update ReservationStatus."
            });
          }
        })
      } else {
        res.send({
          error:  req.body.ReservationPK + "There is no ReservationHeader."
         });
      }
    })
    .catch(err => {
      res.send("error: " + err);
    });
});

// ========================END=====================


module.exports = reservation;
