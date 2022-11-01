export const mapObjectWithOnlyFieldsContainingValue = (object: any, fields: string[]) => {
    const mappedObject = {};
    for (let field of fields) {
        const objectValue = object[field];
        if (!!objectValue) {
            // @ts-ignore
            mappedObject[field] = objectValue;
        }
    }
    return mappedObject;
};
