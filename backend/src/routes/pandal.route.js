// routes/pandalRoutes.js
import express from "express";
import Pandal from "../model/pandal.modal.js";


const router = express.Router();


// utils/haversine.js
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

function toRad(value) {
  return (value * Math.PI) / 180;
}

router.get("/nearest", async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Latitude and Longitude are required" });
    }

    const allPandals = await Pandal.find({});
    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);

    // Calculate distance for each pandal
    const pandalsWithDistance = allPandals.map(pandal => {
      const [lon, lat] = pandal.location.coordinates; 
      const distance = getDistance(userLat, userLon, lat, lon);
      return { ...pandal._doc, distance };
    });


    const nearestPandals = pandalsWithDistance
      .filter(p => p.distance <= 50)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

    res.status(200).json(nearestPandals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});



router.post("/", async (req, res) => {
  try {
    const { title, about, pictures, latitude, longitude } = req.body;

    if (!title || !about || !pictures || !latitude || !longitude) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newPandal = new Pandal({
      title,
      about,
      pictures,
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      }
    });

    await newPandal.save();
    res.status(201).json({ message: "Pandal added successfully", pandal: newPandal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
