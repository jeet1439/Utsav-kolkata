import dotenv from "dotenv";
import mongoose from "mongoose";
import Pandal from "../src/model/pandal.modal.js";

dotenv.config();

const pandals = [
  {
    title: "Barisha Club Durga Puja",
    about:
      "Barisha Club's 2025 Durga Puja theme, Shunyo Prithibi, reflected on the fading legacy and struggles of Bengal's circus performers.",
    pictures: [
      "https://www.kolkatadurgotsav.com/wp-content/uploads/2025/09/barishaclubbehala.jpg",
      "https://thepuja.app/sites/default/files/2025-09/BARISHA%20CLUB.png",
    ],
    nearestMetro: ["Behala Chowrasta Metro", "Mahanayak Uttam Kumar Metro"],
    latitude: 22.4809,
    longitude: 88.3111,
  },
  {
    title: "Kumartuli Park Durga Puja",
    about:
      "A North Kolkata favourite near Bagbazar, known in 2025 guides for traditional clay idol-making, artisan craft, and a heritage puja atmosphere.",
    pictures: [
      "https://www.kolkatadurgotsav.com/wp-content/uploads/2020/09/kumartuli-sarbojanin-durgotsav.jpg",
    ],
    nearestMetro: ["Sovabazar Sutanuti Metro", "Shyambazar Metro"],
    latitude: 22.5998,
    longitude: 88.3612,
  },
  {
    title: "Dum Dum Park Tarun Sangha Durga Puja",
    about:
      "Vibrant Durga Puja in Dum Dum Park. The 2025 theme Satyanneshi paid homage to Byomkesh Bakshi with mystery, comics, vintage details, and interactive passages.",
    pictures: [
      "https://www.kolkatadurgotsav.com/wp-content/uploads/2025/09/dum-dum-park-tarun-sangha.jpg",
      "https://thepuja.app/sites/default/files/2025-09/DUMDUM%20TARUN%20SANGHA.jpg",
    ],
    nearestMetro: ["Dum Dum Metro", "Belgachia Metro"],
    latitude: 22.6184,
    longitude: 88.4166,
  },
  {
    title: "Santosh Mitra Square Durga Puja",
    about:
      "Central Kolkata crowd-puller. In 2025, the Operation Sindoor theme highlighted armed-forces imagery, national pride, and large theatrical installations.",
    pictures: [
      "https://www.livemint.com/lm-img/img/2025/09/30/600x338/G1qx8WQXcAAGou-_1759231319060_1759234572451.jpeg",
      "https://www.livemint.com/lm-img/img/2025/09/30/original/G1qyQxvXwAA93lA_1759231341653.jpeg",
    ],
    nearestMetro: ["Central Metro", "Sealdah Metro"],
    latitude: 22.5684,
    longitude: 88.3653,
  },
  {
    title: "College Square Durga Puja",
    about:
      "Known for lake reflections, lighting, and photography-friendly views. 2025 guides continued to list College Square among Kolkata's key pandal stops.",
    pictures: [
      "https://www.kolkatadurgotsav.com/wp-content/uploads/2020/09/college-square-durga-puja-1.jpg",
    ],
    nearestMetro: ["Mahatma Gandhi Road Metro", "Sealdah Metro"],
    latitude: 22.5765,
    longitude: 88.3639,
  },
  {
    title: "Chetla Agrani Durga Puja",
    about:
      "A major South Kolkata pandal. Its 2025 Amrito Kumbher Sondhane theme drew from Mahakumbh motifs, rudraksha craft, and spiritual storytelling.",
    pictures: [
      "https://thepuja.app/sites/default/files/2025-09/CHETLA%20AGRANI.jpg",
      "https://www.livemint.com/lm-img/img/2025/09/30/original/G2FkgP-WgAA9T-Q_1759232808497.jpeg",
    ],
    nearestMetro: ["Kalighat Metro", "Rabindra Sarobar Metro"],
    latitude: 22.5177,
    longitude: 88.3363,
  },
  {
    title: "Mudiali Club Durga Puja",
    about:
      "A classic South Kolkata stop near Rabindra Sarobar, often paired with the Mudiali and Shiv Mandir pandal-hopping route in 2025 guides.",
    pictures: [
      "https://www.kolkatadurgotsav.com/wp-content/uploads/2025/09/mudialiclubdurgapuja.jpg",
    ],
    nearestMetro: ["Rabindra Sarobar Metro", "Kalighat Metro"],
    latitude: 22.5115,
    longitude: 88.3465,
  },
  {
    title: "Nalin Sarkar Street Sarbojanin Durga Puja",
    about:
      "North Kolkata pandal near Shyambazar, recognised in 2025 lists for compact but expressive artistry rooted in Bengal's nature, clay craft, and heritage.",
    pictures: [
      "https://thepuja.app/sites/default/files/2025-09/NALIN%20SARKAR%20STREET.jpg",
    ],
    nearestMetro: ["Shyambazar Metro", "Sovabazar Sutanuti Metro"],
    latitude: 22.5961,
    longitude: 88.3681,
  },
  {
    title: "Suruchi Sangha Durga Puja",
    about:
      "New Alipore's Suruchi Sangha remains a major South Kolkata attraction, known for annual cultural themes, stage shows, and large immersive design.",
    pictures: [
      "https://www.kolkatadurgotsav.com/wp-content/uploads/2025/08/suruchisangha.jpg",
      "https://www.livemint.com/lm-img/img/2025/09/30/original/G1-_vPPW4AAGiOq_1759230771173.jpeg",
    ],
    nearestMetro: ["Rabindra Sarobar Metro", "Kalighat Metro"],
    latitude: 22.5104,
    longitude: 88.3328,
  },
  {
    title: "Ekdalia Evergreen Club Durga Puja",
    about:
      "A South Kolkata icon near Gariahat, known for tall idols and temple-inspired structures. 2025 guides again placed it among the must-visit pandals.",
    pictures: [
      "https://www.livemint.com/lm-img/img/2025/09/30/original/G133kqvXoAAja9O_1759231746592.jpeg",
      "https://www.kolkatadurgotsav.com/wp-content/uploads/2020/08/ekdalia-evergreen-club.png",
    ],
    nearestMetro: ["Kalighat Metro", "Rabindra Sarobar Metro"],
    latitude: 22.5206,
    longitude: 88.3651,
  },
  {
    title: "Sreebhumi Sporting Club Durga Puja",
    about:
      "Lake Town's high-footfall pandal. For 2025, reports described a BAPS Swaminarayan Akshardham Temple-inspired recreation with large structures and bright festive lighting.",
    pictures: [
      "https://thepuja.app/sites/default/files/2025-09/sreebhumi.jpg",
    ],
    nearestMetro: ["Belgachia Metro", "Lake Town Metro"],
    latitude: 22.6046,
    longitude: 88.4028,
  },
  {
    title: "Ahiritola Sarbojanin Durgotsab",
    about:
      "A heritage North Kolkata puja near Bagbazar Launch Ghat, valued in 2025 guides for cultural events, devotional atmosphere, and its old neighbourhood setting.",
    pictures: [
      "https://www.kolkatadurgotsav.com/wp-content/uploads/2025/08/ahiritolasarbojanin.jpg",
      "https://thepuja.app/sites/default/files/2025-09/AHIRITOLA%20SARBOJANIN.jpg",
    ],
    nearestMetro: ["Sovabazar Sutanuti Metro", "Shyambazar Metro"],
    latitude: 22.5959,
    longitude: 88.3577,
  },
  {
    title: "Badamtala Ashar Sangha Durga Puja",
    about:
      "Kalighat-area pandal known for social-message art and creative installations. 2025 guides continued to call it a thoughtful South Kolkata stop.",
    pictures: [
      "https://thepuja.app/sites/default/files/2025-09/BADAMTALA%20ASHAR%20SANGHA.jpg",
      "https://www.kolkatadurgotsav.com/wp-content/uploads/2020/09/badamtala-ashar-sangha-durga-puja.jpg",
    ],
    nearestMetro: ["Kalighat Metro", "Jatin Das Park Metro"],
    latitude: 22.5187,
    longitude: 88.3451,
  },
  {
    title: "Bosepukur Sitala Mandir Durga Puja",
    about:
      "Kasba-area pandal known for experimental and thought-provoking themes, listed in 2025 guides as one of Kolkata's artistic must-visits.",
    pictures: [
      "https://www.kolkatadurgotsav.com/wp-content/uploads/2025/09/bosepukursitalamandir.jpg",
    ],
    nearestMetro: ["Ruby Hospital Metro", "Kavi Sukanta Metro"],
    latitude: 22.5195,
    longitude: 88.3934,
  },
  {
    title: "Lake Town Adhibasi Brinda Durga Puja",
    about:
      "Lake Town Link Road pandal. The 2025 Tobu Mone Rekho theme used books, typewriters, handwritten letters, and nostalgia-led installations.",
    pictures: [
      "https://www.kolkatadurgotsav.com/wp-content/uploads/2025/09/laketownadhibasibrinda.jpg",
    ],
    nearestMetro: ["Belgachia Metro", "Lake Town Metro"],
    latitude: 22.6019,
    longitude: 88.4071,
  },
  {
    title: "41 Pally Club Durga Puja",
    about:
      "South Kolkata pandal included in 2025 pandal lists, known for detailed festive installations and neighbourhood-scale puja energy.",
    pictures: [
      "https://www.kolkatadurgotsav.com/wp-content/uploads/2025/09/41pallyclubdurgotsav.jpg",
      "https://thepuja.app/sites/default/files/2025-09/1_20250924_213821_0000.png",
    ],
    nearestMetro: ["Kalighat Metro", "Jatin Das Park Metro"],
    latitude: 22.5172,
    longitude: 88.3514,
  },
];

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is missing in backend/.env");
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGO_URI);

  const result = await Pandal.bulkWrite(
    pandals.map(({ latitude, longitude, ...pandal }) => ({
      updateOne: {
        filter: { title: pandal.title },
        update: {
          $set: {
            ...pandal,
            location: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
          },
        },
        upsert: true,
      },
    })),
    { ordered: false }
  );

  console.log(
    JSON.stringify(
      {
        requested: pandals.length,
        inserted: result.upsertedCount,
        updated: result.modifiedCount,
        matched: result.matchedCount,
        titles: pandals.map((pandal) => pandal.title),
      },
      null,
      2
    )
  );
} catch (error) {
  console.error("Failed to seed 2025 pandals:", error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
