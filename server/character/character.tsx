import express from 'express';
const { dbCreateRecord } = require('../db');
const asyncMiddleware = require('../utils/async-middleware');
const router = express.Router();

const characters = [
    { name: 'Ivellios Nailo', age: 23 },
    { name: 'Imrahill 12354 ', age: 74 }
]

/* GET users listing. */
router.get('/all', function (req, res, next) {
    return res.status(200).json(characters);
});

router.post('/', async (req: any, res: any) => {
    await dbCreateRecord()
})

module.exports = router;
