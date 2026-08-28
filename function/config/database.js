const mongoose = require("mongoose");
const dns = require("dns");

const {
    setMongoConnected
} = require("./databaseState");


/* =========================================================
   DNS CONFIGURATION
========================================================= */

dns.setServers([
    "8.8.8.8",
    "1.1.1.1"
]);


/* =========================================================
   CONNECT TO MONGODB
========================================================= */

async function connectDatabase() {

    try {

        await mongoose.connect(
            process.env.MONGODB_URI,
            {
                serverSelectionTimeoutMS: 3000
            }
        );

        setMongoConnected(true);

        console.log(
            "MongoDB connected successfully"
        );

        return true;

    }

    catch (error) {

        setMongoConnected(false);

        console.error(
            "MongoDB connection failed:",
            error.message
        );

        console.log(
            "Falling back to JSON storage."
        );

        return false;

    }

}


mongoose.connection.on(
    "disconnected",
    () => {

        setMongoConnected(false);

        console.log(
            "MongoDB disconnected."
        );

    }
);


mongoose.connection.on(
    "connected",
    () => {

        setMongoConnected(true);

        console.log(
            "MongoDB connection restored."
        );

    }
);


module.exports =
    connectDatabase;