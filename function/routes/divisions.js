const express = require('express');

const router = express.Router();

const divisions =
    require('../data/nigeria-divisions.json');


/* =========================================================
   NIGERIAN ADMINISTRATIVE DIVISIONS

   Exposes only the compact State -> LGA dataset to the
   checkout frontend. Data is bundled locally; no external
   API or key is required.

   Source: open-admin-data/nigeria-administrative-divisions
   License: CC-BY-4.0
   ========================================================= */

router.get('/', (req, res) => {

    res.json({
        success: true,
        attribution: divisions.attribution,
        states: divisions.states
    });

});


module.exports = router;
