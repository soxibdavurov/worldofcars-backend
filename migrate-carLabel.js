// Migration script to convert carLabel from String to nested object
// Run this script: node migrate-carLabel.js
// Yoki MongoDB Compass'da buni ishlatish mumkin

// MongoDB Shell (mongosh) uchun:
/*
// Barcha car'larni olish va yangilash
db.cars.find({}).forEach(function(car) {
  if (typeof car.carLabel === 'string' || !car.carLabel) {
    let carLabelObject = null;
    
    if (typeof car.carLabel === 'string') {
      // String bo'lsa, uni objectga o'zgartirish
      carLabelObject = {
        text: car.carLabel || 'New',
        icon: 'ri-price-tag-3-line',
        class: 'label-default'
      };
    } else if (!car.carLabel) {
      // Agar mavjud bo'lmasa, null qoldirish
      carLabelObject = null;
    }
    
    db.cars.updateOne(
      { _id: car._id },
      { $set: { carLabel: carLabelObject } }
    );
    print('Updated car: ' + car.carTitle);
  } else if (typeof car.carLabel === 'object' && car.carLabel !== null) {
    // Agar allaqachon object bo'lsa, tekshirish
    if (!car.carLabel.text || !car.carLabel.icon || !car.carLabel.class) {
      db.cars.updateOne(
        { _id: car._id },
        {
          $set: {
            'carLabel.text': car.carLabel.text || 'New',
            'carLabel.icon': car.carLabel.icon || 'ri-price-tag-3-line',
            'carLabel.class': car.carLabel.class || 'label-default'
          }
        }
      );
      print('Fixed incomplete carLabel for car: ' + car.carTitle);
    }
  }
});

print('Migration completed!');
*/

// Node.js uchun (MongoDB driver bilan):
const { MongoClient } = require('mongodb');

// O'z MongoDB connection string'ingizni kiriting
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database_name';
const dbName = process.env.DB_NAME || 'your_database_name';

async function migrateCarLabel() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const carsCollection = db.collection('cars');

    // Barcha car'larni olish
    const cars = await carsCollection.find({}).toArray();
    console.log(`Found ${cars.length} cars to migrate`);

    let updated = 0;
    let skipped = 0;

    for (const car of cars) {
      // Agar carLabel String bo'lsa yoki mavjud bo'lmasa
      if (typeof car.carLabel === 'string' || !car.carLabel) {
        let carLabelObject = null;
        
        if (typeof car.carLabel === 'string') {
          // String bo'lsa, uni objectga o'zgartirish
          carLabelObject = {
            text: car.carLabel || 'New',
            icon: 'ri-price-tag-3-line',
            class: 'label-default'
          };
        } else if (!car.carLabel) {
          // Agar mavjud bo'lmasa, null qoldirish
          carLabelObject = null;
        }

        // Yangilash
        await carsCollection.updateOne(
          { _id: car._id },
          {
            $set: {
              carLabel: carLabelObject
            }
          }
        );
        updated++;
        console.log(`Updated car ${car._id}: ${car.carTitle || 'N/A'}`);
      } else if (typeof car.carLabel === 'object' && car.carLabel !== null) {
        // Agar allaqachon object bo'lsa, tekshirish
        if (!car.carLabel.text || !car.carLabel.icon || !car.carLabel.class) {
          await carsCollection.updateOne(
            { _id: car._id },
            {
              $set: {
                'carLabel.text': car.carLabel.text || 'New',
                'carLabel.icon': car.carLabel.icon || 'ri-price-tag-3-line',
                'carLabel.class': car.carLabel.class || 'label-default'
              }
            }
          );
          updated++;
          console.log(`Fixed incomplete carLabel for car ${car._id}`);
        } else {
          skipped++;
        }
      } else {
        skipped++;
      }
    }

    console.log(`\nMigration completed!`);
    console.log(`Updated: ${updated} cars`);
    console.log(`Skipped: ${skipped} cars (already correct)`);

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await client.close();
    console.log('Connection closed');
  }
}

// Script'ni ishga tushirish
if (require.main === module) {
  migrateCarLabel().catch(console.error);
}

module.exports = { migrateCarLabel };
