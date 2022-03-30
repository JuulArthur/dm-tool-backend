import express from 'express';
import _ from 'lodash';
import { dbExecuteAsyncQuery, dbUpdateRecord } from '../db';

const router = express.Router();

interface ChapterInterface {
    id: string;
    title?: string;
    description?: string;
    character_order?: number[];
    location_order?: number[];
}

const mapChapterToDB = (chapter: any) => {
    const mappedObject: ChapterInterface = _.pick(chapter, ['id', 'title', 'description'])
    if (chapter.characterOrder) {
        mappedObject['character_order'] = chapter.characterOrder;
    }
    if (chapter.locationOrder) {
        mappedObject['location_order'] = chapter.locationOrder;
    }
    return mappedObject;
}

const mapChapterToFrontend = (chapter: any) => ({
    id: chapter.id,
    title: chapter.title,
    description: chapter.description,
    characterOrder: chapter.character_order,
    locationOrder: chapter.location_order,
})

router.get('/all', async (req, res, next) => {
    try {
        const chapters = await dbExecuteAsyncQuery('SELECT * FROM chapter');
        return res.status(200).json(chapters.map(mapChapterToFrontend));
    } catch (e) {
        return res.status(500).json(e);
    }
})

router.get('/:id', async (req, res, next) => {
    try {
        const id = req.params.id;
        const characterResult = await dbExecuteAsyncQuery('SELECT * FROM chapter WHERE id = $1', [id]);
        return res.status(200).json(mapChapterToFrontend(characterResult[0]));
    } catch (e) {
        return res.status(500).json(e);
    }
})

router.patch('/:id', async (req, res, next) => {
    try {
        const chapterUpdates = {id: req.params.id, ...req.body};
        const chapterResult = await dbUpdateRecord('chapter', mapChapterToDB(chapterUpdates));
        return res.status(200).json(mapChapterToFrontend(chapterResult));
    } catch (e) {
        console.log('Failed to update chapter', e);
        return res.status(500).json(e);
    }
})

module.exports = router;