const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');

const connectDB = require('./config/db');

const app = express();

//setting up file upload tool Multer
const fileStorage = multer.diskStorage({
	destination: (res, file, cb) => {
		cb(null, 'resumes');
	},
	filename: (req, file, cb) => {
		cb(
			null,
			new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname,
		);
	},
});

const fileFilter = (req, file, cb) => {
	if (
		file.mimetype === 'application/pdf' ||
		file.mimetype === 'application/PDF' ||
		file.mimetype === 'image/jpeg' ||
		file.mimetype === 'image/jpg' ||
		file.mimetype === 'image/png'
	) {
		cb(null, true);
	} else {
		cb(null, false);
	}
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
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
	multer({ storage: fileStorage, fileFilter: fileFilter }).single('resume'),
);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/resumes', express.static(path.join(__dirname, 'resumes')));

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
