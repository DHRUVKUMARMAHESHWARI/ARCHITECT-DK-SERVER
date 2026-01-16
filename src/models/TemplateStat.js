const mongoose = require('mongoose');

const TemplateStatSchema = new mongoose.Schema({
  templateId: {
    type: String,
    required: true,
    unique: true
  },
  count: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('TemplateStat', TemplateStatSchema);
