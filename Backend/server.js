const dotenv = require('dotenv').config();
const app = require('./src/app');
const connectDb = require('./src/db/db');

const PORT = process.env.PORT || 5000;

connectDb();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});