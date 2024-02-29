import { Collection, MongoClient } from 'mongodb';
import 'dotenv/config';

import * as fs from 'fs';
import * as path from 'path';

const argv = require('minimist')(process.argv.slice(2));
const action = argv._[0];
const sourceFile = argv._[1];

const uri = process.env.MONGODB_URI as string;
const databaseName = process.env.MONGODB_DATABASE as string;
const collectionName = process.env.MONGODB_COLLECTION as string;

// TODO: make this as an importable function

async function main() {
	const client = new MongoClient(uri);
	try {
		const documents = getVectorDocuments();

		console.log(documents);

		await client.connect();
		console.log('Connected to MongoDB');

		const database = client.db(databaseName);
		const collection = database.collection(collectionName);

		const result = await collection.insertMany(documents);
		console.log(`Inserted ${result.insertedCount} documents into collection`);
	} catch (e) {
		console.error('Error:', e);
	} finally {
		await client.close();
		console.log('Disconnected from MongoDB');
	}
}

function getVectorDocuments() {
	const articles = readJsonFile(sourceFile);
	const documents: any[] = [];

	articles?.forEach((article) => {
		const metadata: Record<string, any> = { title: article.title, id: article.id };
		const doc = { vector: article.text_vector, metadata: metadata };
		documents.push(doc);
	});

	return documents;
}

// TODO: DRY
function readJsonFile(filePath: string): [any] | null {
	try {
		const data = fs.readFileSync(filePath, 'utf-8');
		const jsonData = JSON.parse(data);
		return jsonData;
	} catch (e) {
		console.error(e);
		return null;
	}
}

main();
