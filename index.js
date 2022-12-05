const express = require('express');
const price = require('./routes/price');
var cors = require('cors')
require('dotenv').config();

const app = express();
app.use(express.json());

app.use(cors());

app.use('/price', price);

app.listen(process.env.PORT || 3000, () => {
    console.log("Server started at port 3000");
});