var express = require('express');
var router = express.Router();

const characters = [
    { name: 'Ivellios Nailo ', age: 23 },
    { name: 'Imrahill 12354 ', age: 74 }
]

/* GET users listing. */
router.get('/all', function (req, res, next) {
    return res.status(200).json(characters);
});

module.exports = router;
