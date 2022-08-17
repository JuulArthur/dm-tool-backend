import express from 'express';
import _ from 'lodash';
import { dbExecuteAsyncQuery, dbFindId, dbUpdateRecord } from '../db';

const router = express.Router();

interface ChapterInterface {
    id: string;
    title?: string;
    description?: string;
    character_order?: number[];
    location_order?: number[];
    characterReferences?: any;
}

interface CharacterToChapterInterface {
    id: string;
    character_id: number;
    chapter_id: number;
    order_id?: number;
}

interface LocationToChapterInterface {
    id: string;
    location_id: number;
    chapter_id: number;
    order_id?: number;
}

const mapChapterToDB = (chapter: any) => {
    const mappedObject: ChapterInterface = _.pick(chapter, ['id', 'title', 'description']);
    if (chapter.characterOrder) {
        mappedObject['character_order'] = chapter.characterOrder;
    }
    if (chapter.locationOrder) {
        mappedObject['location_order'] = chapter.locationOrder;
    }
    return mappedObject;
};

const mapCharacterToChapterToFrontend = (characterToChapter: CharacterToChapterInterface) => ({
    id: characterToChapter.id,
    characterId: characterToChapter.character_id,
    chapterId: characterToChapter.chapter_id,
    order: characterToChapter.order_id,
});

const mapLocationToChapterToFrontend = (locationToChapter: LocationToChapterInterface) => ({
    id: locationToChapter.id,
    locationId: locationToChapter.location_id,
    chapterId: locationToChapter.chapter_id,
    order: locationToChapter.order_id,
});

const mapCharacterToChapterToDb = (characterToChapter: any) => ({
    id: characterToChapter.id,
    character_id: characterToChapter.characterId,
    chapter_id: characterToChapter.chapterId,
    order_id: characterToChapter.order,
});

const mapChapterToFrontend = (chapter: any) => ({
    id: chapter.id,
    title: chapter.title,
    description: chapter.description,
    characterOrder: chapter.character_order,
    locationOrder: chapter.location_order,
    characterReferences: chapter.characterReferences,
    locationReferences: chapter.locationReferences,
});

const getChapter = async ({ id }: { id: string }) => {
    return await dbFindId('chapter', id);
};

const getChapterWithAdditionalData = async ({ id }: { id: string }) => {
    const chapter = await getChapter({ id });
    const characterReferences = await dbExecuteAsyncQuery('SELECT * FROM character_to_chapter WHERE chapter_id = $1', [
        id,
    ]);
    const locationReferences = await dbExecuteAsyncQuery('SELECT * FROM location_to_chapter WHERE chapter_id = $1', [
        id,
    ]);
    chapter.characterReferences = characterReferences.map(mapCharacterToChapterToFrontend);
    chapter.locationReferences = locationReferences.map(mapLocationToChapterToFrontend);
    return chapter;
};

router.get('/all', async (req, res, next) => {
    try {
        const chapters = await dbExecuteAsyncQuery('SELECT * FROM chapter');
        return res.status(200).json(chapters.map(mapChapterToFrontend));
    } catch (e) {
        return res.status(500).json(e);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const id = req.params.id;
        const chapter = await getChapterWithAdditionalData({ id });
        return res.status(200).json(mapChapterToFrontend(chapter));
    } catch (e) {
        return res.status(500).json(e);
    }
});

router.patch('/:id', async (req, res, next) => {
    try {
        const chapterId = req.params.id;
        const chapterUpdates = { id: chapterId, ...req.body };
        await dbUpdateRecord('chapter', mapChapterToDB(chapterUpdates));

        const updatedChapter = await getChapterWithAdditionalData({ id: chapterId });
        return res.status(200).json(mapChapterToFrontend(updatedChapter));
    } catch (e) {
        console.log('Failed to update chapter', e);
        return res.status(500).json(e);
    }
});

router.post('/characterOrder', async (req, res, next) => {
    try {
        const characterOrder = req.body.characterOrder;
        const promises = [];
        for (let characterReference of characterOrder) {
            promises.push(dbUpdateRecord('character_to_chapter', mapCharacterToChapterToDb(characterReference)));
        }
        await Promise.all(promises);
        return res.status(200);
    } catch (e) {
        console.log('Failed to update character order', e);
        return res.status(500).json(e);
    }
});

router.post('/locationOrder', async (req, res, next) => {
    try {
        const locationOrder = req.body.locationOrder;
        const promises = [];
        for (let locationReference of locationOrder) {
            promises.push(
                dbExecuteAsyncQuery(
                    'UPDATE location_to_chapter SET order_id = $1 WHERE location_id=$2 AND chapter_id=$3',
                    [locationReference.order, locationReference.locationId, locationReference.chapterId]
                )
            );
        }
        await Promise.all(promises);
        return res.status(200);
    } catch (e) {
        console.log('Failed to update location order', e);
        return res.status(500).json(e);
    }
});

module.exports = router;
