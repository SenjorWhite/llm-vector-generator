import { exit } from 'process';
import * as path from 'path';
import * as fs from 'fs';
import 'dotenv/config';
import { convert } from 'html-to-text';

const argv = require('minimist')(process.argv.slice(2));
const action = argv._[0];
const sourceFile = argv._[1];

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
