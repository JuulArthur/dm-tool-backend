import express from 'express';
import { dbExecuteAsyncQuery } from '../db';

const router = express.Router();

router.get('/all', async (req, res, next) => {
    try {
        const characters = await dbExecuteAsyncQuery('SELECT * FROM chapter');
        return res.status(200).json(characters);
    } catch (e) {
        return res.status(500).json(e);
    }
})

router.get('/:id', async (req, res, next) => {
    try {
        const id = req.params.id;
        const characters = await dbExecuteAsyncQuery('SELECT * FROM chapter WHERE id = $1', [id]);
        return res.status(200).json(characters[0]);
    } catch (e) {
        return res.status(500).json(e);
    }
})

module.exports = router;