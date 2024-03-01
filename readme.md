## Environment Variables Setup

Setup your environment variables in the system or create a .env file and put in the project root folder with this definitions

-   `OPENAI_API_KEY={{YOUR_OPENAI_API_KEY}}`

-   `MONGODB_URI={{MONGODB_URI}}`

-   `MONGODB_DATABASE={{DATABASE_NAME}}`

-   `MONGODB_COLLECTION={{COLLECTION_NAME}}`

#### How to create a MONGODB cloud service

Create a mongo cloud db and get the URI, the free-tier is enough for testing
https://cloud.mongodb.com/

## Prepare the article in json format

Put your articles in json as this format:

```
[
    {"id":"001","title":"The first Article","html":"<html><div>Html Body</div></html>"},
    {"id":"002","title":"The second Article","html":"<html><div>Html Body</div></html>"},
    ...,
]
```

## Usage

You will need a TypeScript execution engine, we use ts-node here as examples

https://www.npmjs.com/package/ts-node

## Pre-process the Articles to Embeddings

### 1. Get Plain Text from Html

-   ts-node index.ts html2text [input file] [output file]

### 2. Generate questions for articles (use the output file from step 1. as input)

-   ts-node index.ts questions [input file] [output file]

### 3. Convert Articles text and questions to Embeddings / Vectors (use the output file from step 2. as input)

-   ts-node index.ts embedding [input file] [output file]

After these three steps, we get the final output file as our embedding collections file.

## Setup the embeddings with MongoDB

### 1. Upload the dataset

-   ts-node db-handler.ts add [embedding collection file]

### 2. Setup the index on MongoDB Atlas

Follow the instruction to create the Atlas Vector Search Index
https://www.mongodb.com/docs/atlas/atlas-vector-search/tutorials/vector-search-tutorial/#create-the-atlas-vector-search-index

Define the Atlas Vector Search index by the following json

```
{
  "fields": [
    {
      "type": "vector",
      "path": "text_embedding",
      "numDimensions": 1536,
      "similarity": "euclidean"
    },
    {
      "type": "filter",
      "path": "id"
    },
    {
      "type": "filter",
      "path": "title"
    },
    {
      "type": "filter",
      "path": "question"
    }
  ]
}

```

### 3. Invoke the sematic-search within your Vector database

-   ts-node db-handler.ts search "My questions in plain Text"

Then you should get the most similar article ids, titles and questions
