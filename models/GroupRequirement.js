const Sequelize = require('sequelize')
const db = require('../db.js')

module.exports = db.sequelize.define(
  'grouprequirement',
  {
    GroupProgramPK: {
      type: Sequelize.INTEGER,
      primaryKey: true
    },
    SubProgramPK:{
        type: Sequelize.INTEGER
    }, 
    AdultQuantity:{
        type: Sequelize.BOOLEAN
    }, 
    Age57Quantity:{
        type: Sequelize.BOOLEAN
    }, 
    Age810Quantity:{
        type: Sequelize.BOOLEAN
    },
    Age1112Quantity:{
        type: Sequelize.BOOLEAN
    },
    Age1314Quantity:{
        type: Sequelize.BOOLEAN
    },
    Age1415Quantity:{
        type: Sequelize.BOOLEAN
    },
    Age1517Quantity:{
        type: Sequelize.BOOLEAN
    },
    TotalQuantity:{
        type: Sequelize.BOOLEAN
    },
    ProgramRestriction:{
        type: Sequelize.BOOLEAN
    },
    OrganizationName: {
        type: Sequelize.BOOLEAN
    },
    GradeLevel: {
        type: Sequelize.BOOLEAN
    },
    TeacherName: {
        type: Sequelize.BOOLEAN
    },
    TeacherEmail: {
        type: Sequelize.BOOLEAN
    },
    TeacherPhoneNo: {
        type: Sequelize.BOOLEAN
    },
    AlternativeDate: {
        type: Sequelize.BOOLEAN
    },
    EducationPurpose:{
        type: Sequelize.BOOLEAN
    },
    CreatedBy: {
        type: Sequelize.INTEGER
    },
    CreatedDate: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    }
  },
  {
    freezeTableName: true,
  },
  {
    timestamps: false
  }
)