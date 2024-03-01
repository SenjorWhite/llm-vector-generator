import { Collection, MongoClient } from 'mongodb';
import 'dotenv/config';
import OpenAI from 'openai';

import * as fs from 'fs';
import * as path from 'path';

const argv = require('minimist')(process.argv.slice(2));
const action = argv._[0];

const uri = process.env.MONGODB_URI as string;
const databaseName = process.env.MONGODB_DATABASE as string;
const collectionName = process.env.MONGODB_COLLECTION as string;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// TODO: make this as an importable function

async function main() {
	const client = new MongoClient(uri);
	try {
		await client.connect();
		console.log('Connected to MongoDB');
		const sourceFile = argv._[1];

		const database = client.db(databaseName);
		const collection = database.collection(collectionName);

		if (action === 'add') {
			const documents = getVectorDocuments(sourceFile);
			const result = await collection.insertMany(documents);
			console.log(`Inserted ${result.insertedCount} documents into collection`);
		} else if (action === 'search') {
			// TODO: Hint
			// argv._[1] required
			const context = argv._[1];
			const embedding = await getEmbedding(context);
			// console.log(embedding);

			const agg = [
				{
					$vectorSearch: {
						index: 'vector_index',
						path: 'text_embedding',
						queryVector: embedding,
						numCandidates: 10,
						limit: 5,
					},
				},
				{
					$project: {
						_id: 0,
						id: 1,
						title: 1,
						question: 1,
						score: {
							$meta: 'vectorSearchScore',
						},
					},
				},
			];

			const result = collection.aggregate(agg);
			await result.forEach((doc) => console.dir(JSON.stringify(doc)));
		}
	} catch (e) {
		console.error('Error:', e);
	} finally {
		await client.close();
		console.log('Disconnected from MongoDB');
	}
}

function getVectorDocuments(filePath: string) {
	const articles = readJsonFile(filePath);
	const documents: any[] = [];

	articles?.forEach((article) => {
		const doc = {
			text_embedding: article.text_vector,
			title: article.title,
			id: article.id,
			question: 'article-context',
		};
		documents.push(doc);

		if (article.questions) {
			const questions = article.questions;
			const questionVectors = article.question_vectors;
			for (let i = 0; i < questions.length; i++) {
				const doc = {
					text_embedding: questionVectors[i],
					title: article.title,
					id: article.id,
					question: questions[i],
				};
				documents.push(doc);
			}
		}
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

// TODO: DRY
async function getEmbedding(text: string) {
	const embedding = await openai.embeddings.create({
		model: 'text-embedding-ada-002',
		input: text,
		encoding_format: 'float',
	});

	return embedding.data[0].embedding;
}

main();
