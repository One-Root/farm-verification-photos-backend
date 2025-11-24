// scripts/migrate-requestId.js
const mongoose = require('mongoose');
require('dotenv').config();

const Verification = require('./models/Verification');

// Helper function to generate requestId
const generateRequestId = (district, taluk) => {
  const now = new Date();

  const d = district?.[0]?.toUpperCase() || "X";
  const t = taluk?.[0]?.toUpperCase() || "X";

  const yy = String(now.getFullYear()).slice(-2);
  const HH = String(now.getHours()).padStart(2, "0");
  const MM = String(now.getMinutes()).padStart(2, "0");

  const rnd4 = Math.floor(1000 + Math.random() * 9000);

  return `OR${d}${t}${yy}${HH}${MM}${rnd4}`;
};

async function migrateRequestIds() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all documents without requestId
    const docsWithoutRequestId = await Verification.find({
      $or: [
        { requestId: { $exists: false } },
        { requestId: null },
        { requestId: '' }
      ]
    });

    console.log(`📋 Found ${docsWithoutRequestId.length} documents without requestId`);

    if (docsWithoutRequestId.length === 0) {
      console.log('✅ No documents need migration');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const doc of docsWithoutRequestId) {
      try {
        // Generate unique requestId using district and taluk from the document
        let isUnique = false;
        let newRequestId;
        let attempts = 0;

        while (!isUnique && attempts < 10) {
          newRequestId = generateRequestId(doc.district, doc.taluk);
          const existing = await Verification.findOne({ requestId: newRequestId });
          if (!existing) {
            isUnique = true;
          }
          attempts++;
        }

        if (!isUnique) {
          console.error(`❌ Failed to generate unique ID for doc: ${doc._id}`);
          errorCount++;
          continue;
        }

        // Update the document directly
        await Verification.updateOne(
          { _id: doc._id },
          { $set: { requestId: newRequestId } }
        );

        console.log(`✅ Migrated: ${doc._id} -> ${newRequestId} (District: ${doc.district || 'N/A'}, Taluk: ${doc.taluk || 'N/A'})`);
        successCount++;

      } catch (err) {
        console.error(`❌ Error migrating doc ${doc._id}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n========== Migration Summary ==========');
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total processed: ${docsWithoutRequestId.length}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

migrateRequestIds();