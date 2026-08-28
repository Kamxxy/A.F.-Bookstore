let mongoConnected = false;

/* =========================================================
SET DATABASE MODE
========================================================= */

function setMongoConnected(
connected
) {


mongoConnected =
    Boolean(connected);


}

/* =========================================================
CHECK DATABASE MODE
========================================================= */

function isMongoConnected() {


return mongoConnected;


}

/* =========================================================
EXPORT
========================================================= */

module.exports = {


setMongoConnected,

isMongoConnected


};
