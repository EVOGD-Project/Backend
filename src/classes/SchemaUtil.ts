export abstract class SchemaUtil {
	public static transformSchemaToJSON(_: any, returnedObject: Record<string, any>) {
		returnedObject['id'] = returnedObject['_id'];
		delete returnedObject['_id'];
		delete returnedObject['__v'];
		delete returnedObject['password'];
	}
}
