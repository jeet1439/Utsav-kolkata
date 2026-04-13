# Utsav Kolkata

Utsav Kolkata is a full-stack  application designed to help users discover festival pandals of kolkata, share memories, and connect with nearby people in real-time.

## Core Features
* **Location-Based Discovery:** Discover nearby pandals and online users within a 25 km radius utilizing device GPS and MongoDB geospatial queries.
* **Real-Time Messaging:** Experience secure 1-to-1 chat. Messages are transmitted instantly over WebSocket via Socket.IO and stored securely with AES encryption at rest in MongoDB.
* **Social Engagement:** Upload memory photos to community pandal feeds using Cloudinary for media storage, and receive push notifications for likes via Firebase Cloud Messaging (FCM).
* **High-Performance Presence:** Leverages Redis as an ephemeral, low-latency cache with auto-expiring TTLs. This manages live online/offline status efficiently, avoiding expensive write operations to the primary database when user network connections drop.

## Tech Stack
* **Frontend:** React Native CLI, React Navigation, Zustand.
* **Backend:** Node.js, Express, Socket.IO.
* **Databases & Infra:** MongoDB (primary persistent data), Redis (presence cache), Cloudinary (image hosting), FCM (push delivery).

## License & Copyright

©Jeet Kangsabnaik, 2026. 

**Unauthorized cloning, distribution, or modification of this repository is strictly prohibited.** This project is for demonstration and portfolio purposes only. No part of this repository (including the system design, backend architecture, or mobile UI) may be reproduced or used in any form without explicit written permission from the owner.