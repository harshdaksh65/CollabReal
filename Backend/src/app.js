const express = require('express');
const cors = require('cors');
const authroutes = require('./routes/auth.routes');
const documentroutes = require('./routes/document.routes');
const cookieParser = require('cookie-parser');

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());


app.use('/api/auth', authroutes);
app.use('/api/documents', documentroutes);



module.exports = app;