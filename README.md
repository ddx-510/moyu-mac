# Moyu (摸鱼) 🐟

> **"Master the art of looking busy."**

## Overview

**Moyu** (Chinese for "loafing" or "slack off") is a macOS menu bar application designed to help remote workers and developers take guilt-free breaks while maintaining the appearance of productivity. It's your digital shield against burnout and surveillance.

Built with **Electron**, **React**, and **TypeScript**.

## Features

### 🛡️ The Productivity Shield
- **Fake Update**: Simulates a realistic macOS system update screen to deter shoulder surfers.
- **Fake Coding**: An auto-typing code editor that looks like you're writing complex TypeScript/React code.
- **Tide Warning**: A discreet alert system to warn you when "danger" (a manager) is approaching.

### 💰 Value Your Time
- **Money Counter**: Track how much you're "earning" while taking a break based on your hourly wage.
- **Paid Poop Tracker**: Log your bathroom breaks and calculate their financial value.

### 🌊 The Oasis
- **Fish Pond**: A Forest-app style gamification element where you grow a virtual aquarium by taking breaks.
- **Sea & Ocean Theme**: soothing UI with fluid animations.

## Tech Stack

- **Runtime**: [Electron](https://www.electronjs.org/)
- **Frontend**: [React](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Build Tool**: [Electron-Vite](https://electron-vite.org/)

## Development Setup

### Prerequisites
- Node.js (v18+ recommended)
- pnpm or npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/moyu.git
   cd moyu
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Run in development mode:
   ```bash
   npm run dev
   ```

### Building for Production

To build the application for macOS:

```bash
npm run build:mac
```

The output will be in the `dist` directory.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[ISC](https://choosealicense.com/licenses/isc/)
