# QueueFlow

**QueueFlow** is a modern, full-stack transport queue management system built to streamline and optimize passenger boarding at pickup locations. 

QueueFlow handles the entire passenger lifecycle, from joining the queue across multiple channels (USSD, SMS, web, agent) to boarding vehicles. It also provides advanced analytics, live system monitoring, and machine learning-powered predictions for wait times, demand forecasting, and no-show risks.

---

## Key Features

* **Multi-Channel Queueing**: Passengers can join queues via USSD, SMS, Web, or physical Agents.
* **Driver & Vehicle Management**: Track drivers, vehicle capacity, and real-time boarding status.
* **Intelligent Boarding Sessions**: Organize passengers into dynamic boarding sessions for optimized dispatch.
* **Machine Learning Engine**: Pure TypeScript ML models for forecasting demand, predicting wait times, and analyzing passenger no-show risks based on historical data.
* **Monetization & Analytics**: Track revenue transactions, premium queues, driver fees, and agent commissions with rich visualization using Recharts.
* **System Monitoring**: Live dashboard for health checks, database stats, channel breakdown, and location monitoring.
* **Built-in API Console**: Live API tester with request builder and response viewer for easy integration debugging.
* **Alerts & Diagnostics**: Automated scanning for expired tickets, no-shows, stalled sessions, offline drivers, and capacity warnings.
* **Roadmap & Task Tracker**: Integrated project management tool with full CRUD, phase filtering, and progress tracking.

---

## Tech Stack

* **Framework**: [Next.js](https://nextjs.org/) (React 19, App Router)
* **Language**: [TypeScript](https://www.typescriptlang.org/)
* **Database & ORM**: SQLite / [Prisma](https://www.prisma.io/)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
* **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
* **Animations**: [Framer Motion](https://www.framer.com/motion/)
* **Charts**: [Recharts](https://recharts.org/)
* **Package Manager**: [Bun](https://bun.sh/) (or npm/yarn/pnpm)

---

## Getting Started

### Prerequisites
Make sure you have Node.js and Bun installed on your machine.

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd queuflow
   ```

2. **Install dependencies**:
   ```bash
   bun install
   # or npm install / yarn install
   ```

3. **Set up the environment variables**:
   Create a `.env` file in the root directory and add your database URL:
   ```env
   DATABASE_URL="file:./prisma/dev.db"
   ```

4. **Initialize the Database**:
   Push the schema to your database and generate the Prisma Client:
   ```bash
   bun run db:push
   bun run db:generate
   ```

5. **Start the development server**:
   ```bash
   bun run dev
   # or npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## Database Schema Overview

The database is modeled to handle physical transport scenarios:
* **Location**: Pickup locations/stations with capacities.
* **Queue**: Daily queue instances per location.
* **QueueEntry**: Individual passengers waiting to board.
* **Driver & BoardingSession**: Drivers handling specific vehicle types and capacities, linked to boarding sessions.
* **Agent**: Human operators at pickup points.
* **Transaction**: Financial records (passenger fees, agent commissions, etc.).
* **SystemConfig & ActivityLog**: For system settings and audit trails.
* **Task**: For internal project management and roadmap tracking.

---

## Machine Learning Insights

QueueFlow features a robust, zero-dependency pure TypeScript ML engine located at `src/lib/ml/engine.ts`. It includes 9 statistical models running on real database data:
1. Linear Regression (Demand/Revenue Forecasting)
2. Exponential Moving Average (EMA)
3. Seasonal Pattern Detection (Hourly)
4. No-Show Risk Modeling (Based on wait time, channel, time-of-day)
5. Throughput Optimization 
6. Z-Score Anomaly Detection
...and more.

---

## License

This project is licensed under the [MIT License](LICENSE).
