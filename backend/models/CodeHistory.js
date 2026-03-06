const mongoose = require("mongoose");

const codeHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    code: {
      type: String,
      required: true
    },

    language: {
      type: String,
      required: true
    },

    metrics: {
      totalLines: {
        type: Number,
        default: 0
      },
      cyclomaticComplexity: {
        type: Number,
        default: 0
      },
      timeComplexity: {
        type: String,
        default: "O(?)"
      }
    },

    smells: [
      {
        type: String
      }
    ],

    flowNodes: [
      {
        type: {
          type: String,
          default: ""
        },
        label: {
          type: String,
          default: ""
        }
      }
    ],

    aiSuggestions: {
      summary: {
        type: String,
        default: ""
      },
      refactoringHints: [
        {
          type: String
        }
      ],
      performanceTips: [
        {
          type: String
        }
      ]
    }

  },
  { timestamps: true }
);

module.exports = mongoose.model("CodeHistory", codeHistorySchema);
