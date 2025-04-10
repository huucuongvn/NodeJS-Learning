const { create } = require("domain");
const { MongoClient, ObjectId } = require("mongodb");

let cachedClient = null;

async function connectToDatabase(uri) {
  if (!cachedClient) {
    const client = new MongoClient(uri)
    await client.connect()
    cachedClient = client
  }
  return cachedClient.db("nodejs-lambda")
}

exports.testConnection = async () => {
  const uri = process.env.MONGODB_URI
  try {
    const db = await connectToDatabase(uri);
    const collections = await db.listCollections().toArray();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "MongoDB connection successful", collections: collections.map(c => c.name) }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error connecting to MongoDB", error: error.message }),
    };
  }

}

exports.createUser = async (event) => {
  const uri = process.env.MONGODB_URI

  try {
    const db = await connectToDatabase(uri);
    const userCollection = db.collection("users");
    const { name, email } = JSON.parse(event.body);
    if (!name || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Name and email are required" }),
      };
    }
    const result = await userCollection.insertOne({ name, email, createdAt: new Date() });
    return {
      statusCode: 201,
      body: JSON.stringify({ message: "User created successfully", userId: result.insertedId }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error creating user", error: error.message }),
    };
  }
}

exports.getUser = async (event) => {
  const uri = process.env.MONGODB_URI
  const { id } = event.pathParameters;
  const userId = ObjectId.createFromHexString(id);

  try {
    const db = await connectToDatabase(uri);

    const userCollection = db.collection("users");
    const user = await userCollection.findOne({ _id: userId });
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "User not found" }),
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify(user),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error fetching users", error: error.message }),
    };
  }

}

exports.updateUser = async (event) => {
  const uri = process.env.MONGODB_URI
  const { id } = event.pathParameters;
  const userId = ObjectId.createFromHexString(id);
  const { name, email } = JSON.parse(event.body);

  try {
    const db = await connectToDatabase(uri);

    const userCollection = db.collection("users");
    const result = await userCollection.updateOne(
      { _id: userId },
      { $set: { name, email, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "User not found" }),
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User updated successfully!" }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error fetching users", error: error.message }),
    };
  }

}

exports.deleteUser = async (event) => {
  const uri = process.env.MONGODB_URI
  const { id } = event.pathParameters;
  const userId = ObjectId.createFromHexString(id);

  try {
    const db = await connectToDatabase(uri);

    const userCollection = db.collection("users");
    const result = await userCollection.deleteOne({ _id: userId });
    if (result.deletedCount === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "User not found" }),
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User deleted successfully!" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error fetching users", error: error.message }),
    };
  }

}

