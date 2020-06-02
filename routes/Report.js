require('dotenv').config()
const express = require("express");
const cors = require("cors");
const report = express.Router();
const bodyParser = require("body-parser");

const Program = require("../models/Program");
const IndividualProgramRequirement = require("../models/IndividualRequirement");
const GroupProgramRequirement = require("../models/GroupRequirement");
const Schedule = require("../models/Schedule");
const SessionDetails = require("../models/SessionDetails");
const ScheduleSetting = require("../models/ScheduleSetting");
const BlackoutDate = require("../models/ProgramBlackoutDate");

//Define veriable for Sequelize database
const db = require('../db');
const Sequelize = db.sequelize;
const Op = Sequelize.Op;

report.use(bodyParser.json());
report.use(cors());

/****************************************
 * GET RESERVATION BY YEAR RANGE
 * return an arr of objects:
 * {    ProgramPK: '',
 *      ProgramName: '',
 *      Data : [....
 *              {Year: '',
                'jan' : '',
                'feb' : '',
                'mar' : '',
                'apr' : '',
                'may' : '',
                'jun' : '',
                'jul' : '',
                'aug' : '',
                'sep' : '',
                'oct' : '',
                'nov' : '',
                'dec' : ''}
 *      ]
 * }
 * *************************************/
const monthLookUpTable = {
    '01': 'jan', '1': 'jan',
    '02': 'feb', '2': 'feb',
    '03' : 'mar', '3' : 'mar',
    '04' : 'apr', '4' : 'apr',
    '05' : 'may', '5' : 'may',
    '06' : 'jun', '6' : 'jun',
    '07' : 'jul', '7' : 'jul',
    '08' : 'aug', '8' : 'aug',
    '09' : 'sep', '9' : 'sep',
    '10' : 'oct',
    '11' : 'nov',
    '12' : 'dec'
}
report.get("/get-reservation-by-year-range/:start/:end", (req, res) => {    
    var query = `SELECT  program.ProgramPK,program.Name, schedule.Start, substring(schedule.Start, 1, 4) as Year, 
                    substring(schedule.Start, 6,2) as Month, count(*) as Count
                FROM pmmc.reservationheader, pmmc.schedule, pmmc.program
                WHERE reservationheader.SchedulePK = schedule.SchedulePK
                    AND schedule.ProgramPK = program.ProgramPK
                    AND substring(schedule.Start, 1, 4) between (:start) and (:end)
                    AND reservationheader.ReservationStatus in (:ongoing,:attended,:completed)
                GROUP BY Year, Month, program.Name
                ORDER BY program.ProgramPK`;
    Sequelize.query(query,{ 
        replacements: {
            start: req.params.start, 
            end:req.params.end,
            ongoing: process.env.RESERVATION_STATUS_CODE_ON_GOING,
            attended: process.env.RESERVATION_STATUS_CODE_ATTENDED,
            completed: process.env.RESERVATION_STATUS_CODE_COMPLETED
         },
        type: Sequelize.QueryTypes.SELECT})
    .then((reservationInfo) =>{        
        var returnReservationInfo = [];
        reservationInfo.forEach(reservation =>{
            //Check if a program exists in return object
            var tempData = {
                year: reservation.Year,
                'jan' : 0,
                'feb' : 0,
                'mar' : 0,
                'apr' : 0,
                'may' : 0,
                'jun' : 0,
                'jul' : 0,
                'aug' : 0,
                'sep' : 0,
                'oct' : 0,
                'nov' : 0,
                'dec' : 0,
                'total' : 0
            }
            var lookupByProgramPK = returnReservationInfo.filter(x => x.ProgramPK === reservation.ProgramPK);
            if(lookupByProgramPK.length === 0){
                var tempObject = {
                    ProgramPK: reservation.ProgramPK,
                    ProgramName : reservation.Name,
                    Data : []
                }                
                tempData[monthLookUpTable[reservation.Month]] = parseInt(reservation.Count);
                tempObject.Data.push(tempData);
                returnReservationInfo.push(tempObject)                
            }
            else{                
                var lookupByYear = lookupByProgramPK[0].Data.filter(x => x.year === reservation.Year);
                if(lookupByYear.length === 0){                    
                    tempData[monthLookUpTable[reservation.Month]] = parseInt(reservation.Count);
                    lookupByProgramPK[0].Data.push(tempData);                    
                }
                else{
                    lookupByYear[0][monthLookUpTable[reservation.Month]] = parseInt(reservation.Count);
                }
            }            
        });
        returnReservationInfo.forEach(reservation =>{
            reservation.Data[0].total = reservation.Data[0].jan + reservation.Data[0].feb + reservation.Data[0].mar + reservation.Data[0].apr + reservation.Data[0].may
                            + reservation.Data[0].jun + reservation.Data[0].jul + reservation.Data[0].aug + reservation.Data[0].sep + reservation.Data[0].oct
                            + reservation.Data[0].nov + reservation.Data[0].dec
        })

        res.json(returnReservationInfo);
    })
    .catch(err => {
        res.send("errorExpressErr: " + err);
      }) 
});

/****************************************
 * GET PAYMENT BY YEAR RANGE
 * return an arr of objects:
    {Year: paymentYear,
        'jan' : '',
        'feb' : '',
        'mar' : '',
        'apr' : '',
        'may' : '',
        'jun' : '',
        'jul' : '',
        'aug' : '',
        'sep' : '',
        'oct' : '',
        'nov' : '',
        'dec' : ''}

 * *************************************/
report.get("/get-income-by-year-range/:start/:end", (req, res) => {    
    var query = `SELECT payment.CreatedDate, year(payment.CreatedDate) as Year, month(payment.CreatedDate) as Month, Round(sum(total/100),0) as Total
                FROM pmmc.payment
                WHERE year(payment.CreatedDate) between (:start) and (:end)
                Group by Year, Month
                Order by Year desc`;
    Sequelize.query(query,{ 
        replacements: {start: req.params.start, end:req.params.end },
        type: Sequelize.QueryTypes.SELECT})
    .then((paymentInfo) =>{        
        var returnRevenueInfo = [];
        paymentInfo.forEach(payment =>{
            let tempData = {
                year: payment.Year,
                'jan' : 0,
                'feb' : 0,
                'mar' : 0,
                'apr' : 0,
                'may' : 0,
                'jun' : 0,
                'jul' : 0,
                'aug' : 0,
                'sep' : 0,
                'oct' : 0,
                'nov' : 0,
                'dec' : 0,
                'total' : 0
            };
            let lookupByYear = returnRevenueInfo.filter(x => x.year === payment.Year);
            if(lookupByYear.length === 0){  
                tempData[monthLookUpTable[payment.Month]] = parseInt(payment.Total);
                returnRevenueInfo.push(tempData);
            }
            else{
                lookupByYear[0][monthLookUpTable[payment.Month]] = parseInt(payment.Total);
            }            
        })
        //Get refund amount
        var query = `SELECT refund.RefundDate, year(refund.RefundDate) as Year, 
                            month(refund.RefundDate) as Month, Round(sum(Amount/100),0) as Total
                    FROM pmmc.refund
                    WHERE year(refund.RefundDate) between (:start) and (:end)
                    Group by Year, Month
                    Order by Year desc`;
        Sequelize.query(query,{ 
            replacements: {start: req.params.start, end:req.params.end },
            type: Sequelize.QueryTypes.SELECT})
        .then(refundInfo =>{
            refundInfo.forEach(refund =>{
                let tempData = {
                    year: refund.Year,
                    'jan' : 0,
                    'feb' : 0,
                    'mar' : 0,
                    'apr' : 0,
                    'may' : 0,
                    'jun' : 0,
                    'jul' : 0,
                    'aug' : 0,
                    'sep' : 0,
                    'oct' : 0,
                    'nov' : 0,
                    'dec' : 0,
                    'total' : 0
                };
                let lookupByYear = returnRevenueInfo.filter(x => x.year === refund.Year);
                if(lookupByYear.length === 0){  
                    tempData[monthLookUpTable[refund.Month]] = (-1)*parseInt(refund.Total);
                    returnRevenueInfo.push(tempData);
                }
                else{
                    lookupByYear[0][monthLookUpTable[refund.Month]] -= parseInt(refund.Total);
                } 
            })
            //Calculate the total revenue for each year
            returnRevenueInfo.forEach(revenue =>{
                revenue.total = revenue.jan + revenue.feb + revenue.mar + revenue.apr + revenue.may
                                + revenue.jun + revenue.jul + revenue.aug + revenue.sep + revenue.oct
                                + revenue.nov + revenue.dec
            })
            
            res.json(returnRevenueInfo);
        })

        
    })
    .catch(err => {
        res.send("errorExpressErr: " + err);
      }) 
    
})

/*****************************************
* GET CAMP PROGRAM REPORT BY DATE RANGE
******************************************/
report.get("/get-camp-program-by-date-range/:StartDate/:EndDate", (req, res) => {
    var query = `SELECT reservationheader.ReservationPK, program.Name, schedule.Start, schedule.End, 
	                rid.ParticipantName, rid.ParticipantAge, rid.Gender, rid.MerchSize,
                    rid.AllergyInfo, rid.SpecialInfo, rid.InsureProviderName, rid.InsureRecipientName, 
                    rid.InsurePolicyNo, rid.InsurePhoneNo, rid.AuthorizedPickupName1, rid.AuthorizedPickupPhone1,
                    rid.AuthorizedPickupName2, rid.AuthorizedPickupPhone2, rid.EarlyDropOff, rid.LatePickUp
                FROM pmmc.reservationindividualdetails as rid, pmmc.reservationheader, pmmc.schedule, pmmc.program
                WHERE rid.ReservationPK = reservationheader.ReservationPK 
                    and reservationheader.SchedulePK = schedule.SchedulePK 
                    and schedule.ProgramPK = program.ProgramPK 
                    and Lower(program.Name) like 'camp%' 
                    and program.ProgramType = (:individualProgramType)
                    and schedule.Start between (:startDate) and (:endDate)`;
    Sequelize.query(query,{ 
        replacements: {
            startDate   : req.params.StartDate, 
            endDate     : req.params.EndDate,
            individualProgramType   : process.env.PROGRAM_TYPE_CODE_INDIVIDUAL_PROGRAM
        },
        type: Sequelize.QueryTypes.SELECT})
    .then(CampInfo =>{
        if(CampInfo.length > 0){
            CampInfo.forEach(camp =>{
              if(camp.EarlyDropOff != '0000'){
                let temp = camp.EarlyDropOff;
                camp.EarlyDropOff = '';
                camp.EarlyDropOff += (temp[0] == '1' ? 'Mon,' : '')
                camp.EarlyDropOff += (temp[1] == '1' ? 'Tue,' : '')
                camp.EarlyDropOff += (temp[2] == '1' ? 'Wed,' : '')
                camp.EarlyDropOff += (temp[3] == '1' ? 'Thur' : '')
                if(camp.EarlyDropOff.slice(-1) == ','){
                  camp.EarlyDropOff = camp.EarlyDropOff.slice(0, -1) + ''
                }
              }
              else{
                camp.EarlyDropOff = "N/A";
              }
    
              if(camp.LatePickUp != '0000'){
                let temp = camp.LatePickUp;
                camp.LatePickUp = '';
                camp.LatePickUp += (temp[0] == '1' ? 'Mon,' : '')
                camp.LatePickUp += (temp[1] == '1' ? 'Tue,' : '')
                camp.LatePickUp += (temp[2] == '1' ? 'Wed,' : '')
                camp.LatePickUp += (temp[3] == '1' ? 'Thur' : '')
                if(camp.LatePickUp.slice(-1) == ','){
                  camp.LatePickUp = camp.LatePickUp.slice(0, -1) + ''
                }
              }
              else{
                camp.LatePickUp = "N/A";
              }
            })
          }
        res.json(CampInfo);
    })
    .catch(err => {
        res.send("errorExpressErr: " + err);
      }) 
});

/*****************************************
* GET MARKETING INFO BY YEAR RANGE
******************************************/
report.get("/get-marketing-info-by-year-range/:start/:end", (req, res) => {
    var query = `SELECT Year(marketinginformation.CreatedDate) as Year, program.Name as ProgramName, 
                    marketingcontent.Text as Source, marketinginformation.Memo as Info,
                    Count(*) as Count 
                FROM  pmmc.program, pmmc.marketingcontent, pmmc.marketinginformation
                WHERE marketinginformation.MarketingContentPK = marketingcontent.MarketingContentPK 
                    and marketinginformation.ProgramPK = program.ProgramPK
                    and year(marketinginformation.CreatedDate) between (:start) and (:end)
                Group by program.Name, Source, Info, Year
                Order By Year desc`;
    Sequelize.query(query,{ 
        replacements: {start: req.params.start, end:req.params.end },
        type: Sequelize.QueryTypes.SELECT})
    .then(marketingInfo =>{
        res.json(marketingInfo);
    })
    .catch(err => {
        res.send("errorExpressErr: " + err);
      }) 
});

/*****************************************
* GET REVENUE FOR LAST 7 DAYS
******************************************/
report.get("/get-revenue-last-7-days", (req,res) =>{
    var query = `SELECT cast(CreatedDate as date) as FullDate, SUM(Total) as Income 
                FROM pmmc.payment
                WHERE CreatedDate >= DATE_ADD(CURDATE(), INTERVAL -7 DAY)
                GROUP BY FullDate`;
    Sequelize.query(query,{         
        type: Sequelize.QueryTypes.SELECT})
    .then(income =>{
        //Get refund amount
        var query = `SELECT cast(RefundDate as date) as FullDate, SUM(Amount) as Refund 
                    FROM pmmc.refund
                    WHERE RefundDate >= DATE_ADD(CURDATE(), INTERVAL -7 DAY)
                    GROUP BY FullDate`;
        Sequelize.query(query,{         
            type: Sequelize.QueryTypes.SELECT})
        .then(refund =>{
            var returnRevenueInfo = [];
            var todayDate = new Date();
            var last7DaysDate = new Date();
            last7DaysDate.setDate(todayDate.getDate()-7);
            for (var d = last7DaysDate; d <= todayDate; d.setDate(d.getDate() + 1)) {
                var tempObject = {
                    "Date"  : d.toISOString().slice(0,10),
                    "Revenue" : 0
                };
                var lookupByIncome = income.filter(x => x.FullDate === tempObject.Date);                
                var lookupByRefund = refund.filter(x => x.FullDate === tempObject.Date);                
                if(lookupByIncome.length != 0 && lookupByRefund.length != 0){
                    tempObject.Revenue = (parseInt(lookupByIncome[0].Income) - parseInt(lookupByRefund[0].Refund))/100;
                }
                else if(lookupByIncome.length != 0){
                    tempObject.Revenue = (parseInt(lookupByIncome[0].Income))/100;
                }
                else if(lookupByRefund.length != 0){
                    tempObject.Revenue = ((-1)*parseInt(lookupByRefund[0].Refund))/100;
                }
                returnRevenueInfo.push(tempObject);
            }
            res.json(returnRevenueInfo);
        })
        .catch(err => {
            res.send("errorExpressErr: " + err);
          }) 
    })
    .catch(err => {
        res.send("errorExpressErr: " + err);
      }) 
});

/*****************************************
* GET NEW RESERVATION BY PROGRAM TYPE FOR LAST 7 DAYS
******************************************/
report.get("/get-new-reservaiton-by-program-type-last-7-days", (req, res) => {
    var query = `SELECT program.ProgramType, COUNT(ProgramType) as RevCount
                FROM pmmc.reservationheader, pmmc.schedule, pmmc.program	
                WHERE reservationheader.CreatedDate >= DATE_ADD(CURDATE(), INTERVAL -7 DAY)
                    and reservationheader.ReservationStatus in (:ongoing,:pending)
                    and schedule.SchedulePK = reservationheader.SchedulePK
                    and schedule.ProgramPK = program.ProgramPK
                GROUP BY program.ProgramType
                ORDER BY program.ProgramType`;
    Sequelize.query(query,{ 
        replacements: {
            ongoing:    process.env.RESERVATION_STATUS_CODE_ON_GOING, 
            pending:    process.env.RESERVATION_STATUS_CODE_PENDING
        },
        type: Sequelize.QueryTypes.SELECT})
    .then(reservationInfo =>{
        res.json(reservationInfo);
    })
    .catch(err => {
        res.send("errorExpressErr: " + err);
      }) 
});

// ========================END=====================
module.exports = report;
