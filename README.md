# MushroomHub Demo

A responsive local mushroom marketplace demo. The frontend uses React, Vite, and the supplied MushroomHub artwork. The Spring Boot API serves the demo catalog and a health endpoint.

## Run the frontend

```powershell
npm install
npm run dev
```

Open the Vite URL printed in the terminal (usually `http://localhost:5173`).

## Run the Spring Boot API

Install Java 17+ and Maven, then:

```powershell
cd backend
mvn spring-boot:run
```

The API runs at `http://localhost:8080`. Try `/api/health` and `/api/mushrooms`. The marketplace uses the API catalog when it is available and falls back to its bundled demo catalog when the backend is stopped.

## Demo scope

Product search, variety filtering, product details, and a local-storage cart are interactive. Account forms and checkout are sample flows only; no real account, payment, fulfillment, or database is configured.
