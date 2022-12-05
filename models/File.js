const mongoose = require("mongoose")

mongoose.connect("mongodb+srv://kap:123@cluster0.knqk36p.mongodb.net/?retryWrites=true&w=majority");
mongoose.connection.dropDatabase();

const File = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  }, 
  originalName: {
    type: String,
    required: true,
  },
  password: String,
  downloadCount: {
    type: Number,
    required: true,
    default: 0,
  },
}, { timestamps: true })

File.index({ expireAt: 1 }, { expires: '1d' })


module.exports = mongoose.model("File", File)