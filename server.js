require("dotenv").config()
const express = require("express")
const fs = require('fs');

const multer = require("multer")
const bcrypt = require("bcrypt")
const File = require("./models/File")

const app = express()

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

const upload = multer({ dest: "public/uploads" })

app.get("/", (req, res) => {    
  handleExpiredFiles(req, res);

  res.render("index")
})

app.get("/upload", (req, res) => {
  res.render("upload")
})

app.get("/download", (req, res) => {
  res.render("download")
})

app.get("/download/:title", (req, res) => {
  res.render("download", { fileData: { title: req.params.title, password: "" } })
})

app.get("/browse", async (req, res) => {
  const files = await File.find().sort({_id:-1}).limit(50)
  res.render("browse", { files })
})

app.post("/upload", upload.single("file"), async (req, res) => {

  const duplicateTitle = await File.find({ title: req.body.title })

  if(duplicateTitle.length > 0) {
    res.render("upload", { alert: "Title already taken!", fileData: req.body })
    return
  }

  const fileData = {
    path: req.file.path,
    originalName: req.file.originalname
  }
  if (req.body.title != null && req.body.title != "") {
    fileData.title = req.body.title
  }
  if (req.body.password != null && req.body.password != "") {
    fileData.password = await bcrypt.hash(req.body.password, 10)
  }

  fileData.createdAt = new Date()

  const file = await File.create(fileData)

  res.render("index", { alert: "File Successfully Uploaded :)" })
})

app.post("/download", async (req, res) => {

  const file = await File.findOne({ title: req.body.title })

  if(file == null) {
    res.render("download", { alert: "File Not Found!", fileData: req.body })
    return
  }

  if (file.password != null) {
    if(!(await bcrypt.compare(req.body.password, file.password))) {
      res.render("download", { alert: "Wrong Password!", fileData: req.body })
      return
    }
  }

  file.downloadCount++
  await file.save()

  res.download(file.path, file.originalName)
})

app.listen(process.env.PORT, () => {
  console.log(`App listening at http://localhost:${process.env.PORT}`)
})


// utils
function handleExpiredFiles(req, res) {
  fs.readdir(__dirname + '/uploads', async (err, files) => {
    if(files == null) return

    const filesToDelete = []
    
    const documents = await File.find()
    const docPaths = []

    documents.forEach(document => {
      docPaths.push(document.path)
    })

    files.forEach(file => {
      if(!(docPaths.includes(`uploads\\${file}`)) && !(docPaths.includes(`uploads/${file}`))) {
        filesToDelete.push(file)
      }
    });

    filesToDelete.forEach((file) => {
      fs.unlinkSync(`uploads/${file}`)
    })
  });
}