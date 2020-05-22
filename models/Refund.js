const Sequelize = require('sequelize')
const db = require('../db.js')

module.exports = db.sequelize.define(
  'refund',
  {
    ChargeToken: {
      type: Sequelize.TEXT,
      primaryKey: true
    },
    RefundToken: {
      type: Sequelize.TEXT,
      primaryKey: true
    },
    Amount: {
      type: Sequelize.INTEGER
    },
    RefundReason: {
      type: Sequelize.TEXT
    },
    RefundDate: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    },
    IssueRefundBy: {
      type: Sequelize.INTEGER
    }
  },
  {
    freezeTableName: true,
  },
  {
    timestamps: false
  }
)