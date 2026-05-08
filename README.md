# QueueFlow

**QueueFlow** is a modern, full-stack transport queue management system built to streamline and optimize passenger boarding at pickup locations. It transforms chaotic physical queues into a data-driven, transparent, and monetized operation.

QueueFlow handles the entire passenger lifecycle, from joining the queue across multiple channels (USSD, SMS, web, agent) to boarding vehicles. It also provides advanced analytics, live system monitoring, and machine learning-powered predictions.

---

## Key Features

*   **Multi-Channel Queueing**: Passengers can join queues via USSD, SMS, Web, or physical Agents, catering to both smartphone users and those with basic feature phones.
*   **Driver & Vehicle Management**: Real-time tracking of driver availability, vehicle capacity, and live boarding status.
*   **Intelligent Boarding Sessions**: Automatically organizes passengers into dynamic boarding sessions optimized by vehicle type and current demand.
*   **Machine Learning Insights**: Pure TypeScript ML models for forecasting demand, predicting wait times, and analyzing passenger no-show risks.
*   **Monetization Engine**: Integrated transaction tracking for passenger fees, driver commissions, and premium queue services.
*   **System Observability**: A "Deep Dark" dashboard for health checks, database latency monitoring, and channel distribution.
*   **Built-in API Console**: Interactive API tester with a request builder and response viewer for developers.
*   **Persistence & Audit**: Full activity logging and ML performance tracking via dedicated database models.

---

## 🛠 Tech Stack

*   **Framework**: [Next.js](https://nextjs.org/) (React 19, App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Database**: SQLite with [Prisma ORM](https://www.prisma.io/)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with a custom Glassmorphism design system.
*   **Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
*   **Charts**: [Recharts](https://recharts.org/) for predictive visualization.
*   **Animations**: [Framer Motion](https://www.framer.com/motion/) for smooth UI transitions.

---

## Machine Learning Engine

QueueFlow features a custom, zero-dependency ML engine (`src/lib/ml/engine.ts`) specifically tuned for transport logistics:

1.  **Demand Forecasting**: Uses Linear Regression and EMA to predict passenger volume for the next 6 hours.
2.  **No-Show Risk Model**: Calculates abandonment probability based on queue position, wait time, and entry channel.
3.  **Throughput Optimization**: Recommends optimal boarding group sizes based on current driver supply and historical efficiency.
4.  **Anomaly Detection**: Z-Score analysis to identify unusual spikes or drops in station activity.
5.  **Revenue Projections**: Financial forecasting for weekly and monthly earnings.
6.  **Persistence**: All ML activities are logged in the `MLActivity` table to track model accuracy over time.

---

## Database Architecture

The system uses a highly relational schema to mirror real-world transport stations:

*   **Location**: Physical stations with geo-coordinates and capacity limits.
*   **Queue**: Daily instances managing passenger flow.
*   **QueueEntry**: Individual tickets with status tracking (Waiting -> Called -> Boarded).
*   **Driver & BoardingSession**: Links vehicles to specific groups of passengers.
*   **MLActivity**: Persistent logs of machine learning runs and their operational insights.
*   **Transaction**: Financial ledger for all station revenue.

---

## Getting Started

### Prerequisites
*   Node.js (v18+)
*   npm or Bun

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Algo-Vision404/pro_01.git
    cd queuflow
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    # or bun install
    ```

3.  **Environment Setup**:
    Create a `.env` file:
    ```env
    DATABASE_URL="file:./db/custom.db"
    ```

4.  **Sync Database**:
    ```bash
    npx prisma db push
    npx prisma generate
    ```

5.  **Run Development Server**:
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

---

## Roadmap

*   [x] Core Queue Management Logic
*   [x] USSD/SMS Integration Simulation
*   [x] ML Insight persistence layer
*   [ ] Real-time WebSocket notifications
*   [ ] Multi-station administrative dashboard
*   [ ] Integration with mobile payment gateways (MoMo/Stripe)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
