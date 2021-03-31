const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const cors = require('cors');

const connectDB = require('./config/db');

const app = express();

//setting up file upload tool Multer
const imgFileStorage = multer.diskStorage({
  destination: (res, file, cb) => {
    cb(null, './uploads/profile-pictures');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const resumeFileStorage = multer.diskStorage({
  destination: (res, file, cb) => {
    cb(null, './uploads/profile-pictures');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const imgFileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG)$/)) {
    req.fileValidationError = 'Only image files are allowed!';
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const docFileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(doc|DOC|docx|DOCX|pdf|PDF)$/)) {
    req.fileValidationError = 'Only doc type files are allowed!';
    return cb(new Error('Only doc type files are allowed!'), false);
  }
  cb(null, true);
};

//registering routes files
const authRoute = require('./routes/auth');
const userRoute = require('./routes/user');
const companyRoute = require('./routes/company');
const postRoute = require('./routes/post');
const stateRoute = require('./routes/state');
const tagRoute = require('./routes/tag');

//connect Database
connectDB();

//init middleware
app.use(express.json({ extended: false }));

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));

app.use(
  multer({ storage: imgFileStorage, fileFilter: imgFileFilter }).single('profilePictureFile'),
);
app.use(
  '/api/upload/profile-pictures',
  express.static(path.join(__dirname, 'uploads/profile-pictures')),
);

app.use(multer({ storage: resumeFileStorage, fileFilter: docFileFilter }).single('resumeFile'));
app.use('/api/upload/resume', express.static(path.join(__dirname, 'uploads/resumes')));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res, next) => res.send('API Running...'));

app.use('/api/auth', authRoute);
app.use('/api/company', companyRoute);
app.use('/api/user', userRoute);
app.use('/api/posts', postRoute);
app.use('/api/states', stateRoute);
app.use('/api/tags', tagRoute);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
