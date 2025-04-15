import { Client, Account, Databases, Storage, ID } from 'appwrite';

const client = new Client();

client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT as string)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT as string);

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

const appwriteConfig = {
    databaseId: process.env.APPWRITE_DATABASE_ID as string,
    usersCollectionId: process.env.APPWRITE_USERS_COLLECTION_ID as string,
    accountsCollectionId: process.env.APPWRITE_ACCOUNTS_COLLECTION_ID as string,
    transactionsCollectionId: process.env.APPWRITE_TRANSACTIOS_COLLECTION_ID as string,
    planCollectionId: process.env.APPWRITE_PLAN_COLLECTION_ID as string,
};

export { client, account, databases, storage, appwriteConfig, ID };