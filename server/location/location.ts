import express from 'express';
import { dbCreateRecord, dbExecuteAsyncQuery } from '../db';

const router = express.Router();

const mapLocationToBackend = (location: any) => ({
    id: location.id,
    name: location.name,
    description: location.description,
    info: location.info,
    original_content: location.originalContent,
});

const mapLocationToFrontend = (location: any) => ({
    id: location.id,
    name: location.name,
    description: location.description,
    info: location.info,
    originalContent: location.original_content,
});

const createLocationToChapterForLocation = async ({
    chapterId,
    locationId,
}: {
    chapterId: string,
    locationId: string,
}) => {
    const locationWithHighestOrder = await dbExecuteAsyncQuery(
        'SELECT * FROM location_to_chapter WHERE chapter_id = $1 ORDER BY order_id DESC LIMIT 1',
        [chapterId]
    );
    const nextOrderNumber = locationWithHighestOrder[0] ? locationWithHighestOrder[0].order_id + 1 : 0;
    return await dbCreateRecord('location_to_chapter', {
        location_id: locationId,
        chapter_id: chapterId,
        order_id: nextOrderNumber,
    });
};

router.get('/all', async (req, res, next) => {
    try {
        const locations = await dbExecuteAsyncQuery('SELECT * FROM location');
        return res.status(200).json(locations.map(mapLocationToFrontend));
    } catch (e) {
        return res.status(500).json(e);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const location = await dbExecuteAsyncQuery('SELECT * FROM location WHERE id = $1', [req.params.id]);
        return res.status(200).json(mapLocationToFrontend(location[0]));
    } catch (e) {
        return res.status(500).json(e);
    }
});

router.post('/', async (req: any, res: any) => {
    try {
        const data = req.body;
        const mappedData = mapLocationToBackend(data);
        delete mappedData.id;
        const result = await dbCreateRecord('location', mappedData);
        if (data.chapterId) {
            await createLocationToChapterForLocation({ chapterId: data.chapterId, locationId: result.id });
        }
        return res.status(200).json(result);
    } catch (e) {
        console.log('e', e);
        return res.status(500).json({ error: 'Something went wrong' });
    }
});

module.exports = router;
