import express from 'express';
import { dbCreateRecord, dbExecuteAsyncQuery, dbUpdateRecord } from '../db';
import _ from 'lodash';
import { mapObjectWithOnlyFieldsContainingValue } from '../utils';

const router = express.Router();

interface LocationInterface {
    id: string;
    name?: string;
    description?: string;
    info?: string;
    original_content?: string;
}

const mapLocationToBackend = (location: any) => ({
    id: location.id,
    name: location.name,
    description: location.description,
    info: location.info,
    original_content: location.originalContent,
});

const mapLocationToDb = (location: any) => {
    const mappedObject: LocationInterface = {
        id: location.id,
        ...mapObjectWithOnlyFieldsContainingValue(location, ['id', 'name', 'description', 'info']),
    };
    if (location.originalContent) {
        mappedObject['original_content'] = location.originalContent;
    }
    return mappedObject;
};

const mapLocationToFrontend = (location: any) => ({
    id: location.id,
    name: location.name,
    description: location.description,
    info: location.info,
    originalContent: location.original_content,
});

const mapLocationToChapterToFrontend = (locationToChapter: any) => ({
    id: locationToChapter.id,
    locationId: locationToChapter.location_id,
    chapterId: locationToChapter.chapter_id,
    order: locationToChapter.order_id,
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

router.patch('/:id', async (req, res, next) => {
    const { name, description, info, originalContent } = req.body;
    try {
        const location = await dbUpdateRecord(
            'location',
            mapLocationToDb({ id: req.params.id, name, description, info, originalContent })
        );
        return res.status(200).json(mapLocationToFrontend(location));
    } catch (e) {
        console.log('e', e);
        return res.status(500).json(e);
    }
});

router.post('/', async (req: any, res: any) => {
    try {
        const data = req.body;
        const mappedData = mapLocationToBackend(data);
        delete mappedData.id;
        const location = await dbCreateRecord('location', mappedData);
        let locationToChapter;
        if (data.chapterId) {
            locationToChapter = await createLocationToChapterForLocation({
                chapterId: data.chapterId,
                locationId: location.id,
            });
        }
        return res.status(200).json({
            location: mapLocationToFrontend(location),
            locationToChapterReference: locationToChapter && mapLocationToChapterToFrontend(locationToChapter),
        });
    } catch (e) {
        console.log('e', e);
        return res.status(500).json({ error: 'Something went wrong' });
    }
});

router.get('/location-to-chapter-reference/all', async (req, res, next) => {
    try {
        const locations = await dbExecuteAsyncQuery('SELECT * FROM location_to_chapter');
        return res.status(200).json(locations.map(mapLocationToChapterToFrontend));
    } catch (e) {
        return res.status(500).json(e);
    }
});

module.exports = router;
