import { exit } from 'process';
import OpenAI from 'openai';
import * as path from 'path';
import * as fs from 'fs';
import 'dotenv/config';
import { convert } from 'html-to-text';

const argv = require('minimist')(process.argv.slice(2));
const action = argv._[0];
const sourceFile = argv._[1];
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

main();

async function main() {
	if (!action || !sourceFile) {
		// TODO: Hint
		exit();
	}

	const articles = readJsonFile(sourceFile);
	if (!articles) {
		// TODO: Hint
		exit();
	}

	if (action === 'html2text') {
		const outputFile = argv._[2] || `${path.parse(sourceFile).name}-H2T-${Date.now()}.json`;
		try {
			articles.forEach((article) => {
				article.text = convert(article.html);
			});

			fs.writeFileSync(outputFile, JSON.stringify(articles));
		} catch (e) {
			// TODO: Hint
			console.error(e);
		}
	} else if (action === 'embedding') {
		const outputFile = argv._[2] || `EMBEDDING-${Date.now()}.lvg.json`;
		try {
			// TODO: Customizable Field Names
			for (let i = 0; i < articles.length; i++) {
				if (articles[i].text) {
					const embedding = await getEmbedding(articles[i].text);
					articles[i].text_vector = embedding;

					if (articles[i].questions) {
						const questions = articles[i].questions;
						articles[i].question_vectors = [];
						for (let j = 0; j < questions.length; j++) {
							const embedding = await getEmbedding(questions[j]);
							articles[i].question_vectors[j] = embedding;

							console.log(questions[j]);
						}
					}
				}
			}

			fs.writeFileSync(outputFile, JSON.stringify(articles));
		} catch (e) {
			// TODO: Hint
			console.error(e);
		}
	} else if (action === 'questions') {
		const outputFile = argv._[2] || `QUESTIONS-${Date.now()}.lvg.json`;

		try {
			// TODO: Customizable Field Names
			for (let i = 0; i < articles.length; i++) {
				if (articles[i].text) {
					const questions = await getQuestions(articles[i].text);
					articles[i].questions = questions;

					console.log(articles[i].title);
					console.log(questions);
				}
			}

			fs.writeFileSync(outputFile, JSON.stringify(articles));
		} catch (e) {
			// TODO: Hint
			console.error(e);
		}
	}
}

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

async function getEmbedding(text: string) {
	const embedding = await openai.embeddings.create({
		model: 'text-embedding-ada-002',
		input: text,
		encoding_format: 'float',
	});

	return embedding.data[0].embedding;
}

async function getQuestions(text: string) {
	const completion = await openai.chat.completions.create({
		messages: [
			{
				role: 'system',
				content: `Please design questions which can full cover this article, the format should be ["question_1","question_2", ...]:
				${text} `,
			},
		],
		model: 'gpt-3.5-turbo-0125',
	});

	console.log(completion.choices[0]);
	try {
		const questions = JSON.parse(completion.choices[0].message.content as string);
		return questions;
	} catch (e) {
		return null;
	}
}
