import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

if (!process.env.MONGODB_URI) {
  throw new Error('The MONGODB_URI environment variable is missing. Please check your .env file.');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    try {
      client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect();
    } catch (e) {
      console.error("Failed to create MongoDB client", e);
      throw new Error("Failed to create MongoDB client. Please ensure the MONGODB_URI is valid.");
    }
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  try {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  } catch (e) { 
      console.error("Failed to connect to MongoDB", e);
      throw new Error("Failed to connect to MongoDB. Please ensure the database server is running and the MONGODB_URI is correct.");
  }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
