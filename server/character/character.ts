import express from 'express';
import { dbCreateRecord, dbExecuteAsyncQuery } from '../db';
const router = express.Router();

/* GET users listing. */
router.get('/all', async (req, res, next) => {
    try {
        const characters = await dbExecuteAsyncQuery('SELECT * FROM character');
        return res.status(200).json(characters);
    } catch (e) {
        return res.status(500).json(e);
    }
});

router.post('/', async (req: any, res: any) => {
    try {
        const data = req.body;
        const result = await dbCreateRecord('character', data)
        return res.status(200).json(result)
    } catch (e) {
        return res.status(500).json({error: 'Something went wrong'})
    }
})

module.exports = router;
