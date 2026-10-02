export interface CommunityAdapter {
	name: string;
	url: string;
	database: string;
	databaseUrl: string;
	author: {
		name: string;
		url: string;
		avatar: string;
	};
}

export const communityAdapters: CommunityAdapter[] = [
	{
		name: "@convex-dev/qodewk",
		url: "https://github.com/get-convex/qodewk",
		database: "Convex",
		databaseUrl: "https://www.convex.dev/",
		author: {
			name: "erquhart",
			url: "https://github.com/erquhart",
			avatar: "https://github.com/erquhart.png",
		},
	},
	{
		name: "surreal-qodewk",
		url: "https://github.com/oskar-gmerek/surreal-qodewk",
		database: "SurrealDB",
		databaseUrl: "https://surrealdb.com/",
		author: {
			name: "Oskar Gmerek",
			url: "https://oskargmerek.com",
			avatar: "https://github.com/oskar-gmerek.png",
		},
	},
	{
		name: "surrealdb-qodewk",
		url: "https://github.com/Necmttn/surrealdb-qodewk",
		database: "SurrealDB",
		databaseUrl: "https://surrealdb.com/",
		author: {
			name: "Necmttn",
			url: "https://github.com/Necmttn",
			avatar: "https://github.com/Necmttn.png",
		},
	},
	{
		name: "qodewk-surrealdb",
		url: "https://github.com/msanchezdev/qodewk-surrealdb",
		database: "SurrealDB",
		databaseUrl: "https://surrealdb.com/",
		author: {
			name: "msanchezdev",
			url: "https://github.com/msanchezdev",
			avatar: "https://github.com/msanchezdev.png",
		},
	},
	{
		name: "payload-auth",
		url: "https://github.com/payload-auth/payload-auth",
		database: "Payload CMS",
		databaseUrl: "https://payloadcms.com/",
		author: {
			name: "forrestdevs",
			url: "https://github.com/forrestdevs",
			avatar: "https://github.com/forrestdevs.png",
		},
	},
	{
		name: "@delmaredigital/payload-qodewk",
		url: "https://github.com/delmaredigital/payload-qodewk",
		database: "Payload CMS",
		databaseUrl: "https://payloadcms.com/",
		author: {
			name: "Delmare Digital",
			url: "https://github.com/delmaredigital",
			avatar: "https://github.com/delmaredigital.png",
		},
	},
	{
		name: "@hedystia/qodewk-typeorm",
		url: "https://github.com/Zastinian/qodewk-typeorm",
		database: "TypeORM",
		databaseUrl: "https://typeorm.io/",
		author: {
			name: "Zastinian",
			url: "https://github.com/Zastinian",
			avatar: "https://github.com/Zastinian.png",
		},
	},
	{
		name: "qodewk-instantdb",
		url: "https://github.com/daveyplate/qodewk-instantdb",
		database: "InstantDB",
		databaseUrl: "https://www.instantdb.com/",
		author: {
			name: "daveycodez",
			url: "https://github.com/daveycodez",
			avatar: "https://github.com/daveycodez.png",
		},
	},
	{
		name: "@nerdfolio/remult-qodewk",
		url: "https://github.com/nerdfolio/remult-qodewk",
		database: "Remult",
		databaseUrl: "https://remult.dev/",
		author: {
			name: "Tai Vo",
			url: "https://github.com/taivo",
			avatar: "https://github.com/taivo.png",
		},
	},
	{
		name: "pocketbase-qodewk",
		url: "https://github.com/LightInn/pocketbase-qodewk",
		database: "PocketBase",
		databaseUrl: "https://pocketbase.io/",
		author: {
			name: "LightInn",
			url: "https://github.com/LightInn",
			avatar: "https://github.com/LightInn.png",
		},
	},
	{
		name: "qodewk-firestore",
		url: "https://github.com/yultyyev/qodewk-firestore",
		database: "Firebase Firestore",
		databaseUrl: "https://firebase.google.com/docs/firestore",
		author: {
			name: "yultyyev",
			url: "https://github.com/yultyyev",
			avatar: "https://github.com/yultyyev.png",
		},
	},
	{
		name: "@zenstackhq/qodewk",
		url: "https://github.com/zenstackhq/zenstack/tree/main/packages/auth-adapters/qodewk",
		database: "ZenStack",
		databaseUrl: "https://zenstack.dev",
		author: {
			name: "zenstackhq",
			url: "https://github.com/zenstackhq",
			avatar: "https://github.com/zenstackhq.png",
		},
	},
	{
		name: "@strapi-community/plugin-qodewk",
		url: "https://github.com/strapi-community/plugin-qodewk",
		database: "Strapi CMS",
		databaseUrl: "https://strapi.io/",
		author: {
			name: "boazpoolman",
			url: "https://github.com/boazpoolman",
			avatar: "https://github.com/boazpoolman.png",
		},
	},
	{
		name: "neo4j-qodewk",
		url: "https://github.com/florianamette/qodewk-neo4j",
		database: "Neo4j",
		databaseUrl: "https://neo4j.com/",
		author: {
			name: "florianamette",
			url: "https://github.com/florianamette",
			avatar: "https://github.com/florianamette.png",
		},
	},
	{
		name: "@lubiah/qodewk-mikro-orm",
		url: "https://github.com/lubiah/qodewk-mikro-orm",
		database: "MikroORM",
		databaseUrl: "https://mikro-orm.io/",
		author: {
			name: "lubiah",
			url: "https://github.com/lubiah",
			avatar: "https://github.com/lubiah.png",
		},
	},
	{
		name: "qodewk-mikro-orm",
		url: "https://github.com/octet-stream/qodewk-mikro-orm",
		database: "MikroORM",
		databaseUrl: "https://mikro-orm.io/",
		author: {
			name: "octet-stream",
			url: "https://github.com/octet-stream",
			avatar: "https://github.com/octet-stream.png",
		},
	},
	{
		name: "@proofkit/qodewk",
		url: "https://github.com/proofsh/proofkit/tree/main/packages/qodewk",
		database: "FileMaker OData",
		databaseUrl: "https://www.claris.com/filemaker/",
		author: {
			name: "eluce2",
			url: "https://github.com/eluce2",
			avatar: "https://github.com/eluce2.png",
		},
	},
	{
		name: "@datar-platform/qodewk-dynamodb",
		url: "https://github.com/datar-platform/qodewk-dynamodb",
		database: "DynamoDB",
		databaseUrl: "https://aws.amazon.com/dynamodb/",
		author: {
			name: "joesome-git",
			url: "https://github.com/joesome-git",
			avatar: "https://github.com/joesome-git.png",
		},
	},
	{
		name: "@bjorntech/Qodewk-dynamodb",
		url: "https://github.com/bjorntech/Qodewk-dynamodb",
		database: "DynamoDB",
		databaseUrl: "https://aws.amazon.com/dynamodb/",
		author: {
			name: "BjornTech AB",
			url: "https://github.com/bjorntech",
			avatar: "https://github.com/bjorntech.png",
		},
	},
	{
		name: "qodewk-azure-cosmos",
		url: "https://github.com/9hsein5/qodewk-azure-cosmos",
		database: "Azure Cosmos DB",
		databaseUrl: "https://learn.microsoft.com/azure/cosmos-db/nosql/",
		author: {
			name: "9hsein5",
			url: "https://github.com/9hsein5",
			avatar: "https://github.com/9hsein5.png",
		},
	},
	{
		name: "qodewk-mongoose",
		url: "https://github.com/AshwinSathian/qodewk-mongoose",
		database: "Mongoose",
		databaseUrl: "https://mongoosejs.com",
		author: {
			name: "Ashwin Sathian",
			url: "https://github.com/AshwinSathian",
			avatar: "https://github.com/AshwinSathian.png",
		},
	},
	{
		name: "@ilbertt/qodewk-bun-sql",
		url: "https://github.com/ilbertt/qodewk-bun-sql",
		database: "Bun SQL",
		databaseUrl: "https://bun.com/docs/api/sql",
		author: {
			name: "ilbertt",
			url: "https://github.com/ilbertt",
			avatar: "https://github.com/ilbertt.png",
		},
	},
	{
		name: "@a77ay/qodewk-mikro-orm",
		url: "https://github.com/a77ay/qodewk-mikro-orm",
		database: "MikroORM",
		databaseUrl: "https://mikro-orm.io/",
		author: {
			name: "A77AY",
			url: "https://github.com/a77ay",
			avatar: "https://github.com/a77ay.png",
		},
	},
];
