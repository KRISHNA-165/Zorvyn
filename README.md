# Personal Finance Companion Mobile App

A mobile-first personal finance companion built with React Native, Expo, and TypeScript. The app is designed to help users track everyday money activity, understand spending patterns, manage savings goals, and view lightweight insights in a polished mobile experience.

## Project Overview

This project was built as a practical mobile product exercise around:

- screen design and navigation
- transaction management flows
- local data persistence
- state handling
- product thinking for a lightweight finance companion

The app is intentionally positioned as a personal finance companion rather than a banking app. It focuses on quick daily usage, clear summaries, simple goal tracking, and useful insights.

## Tech Stack

- React Native
- Expo
- TypeScript
- Expo Router for navigation
- Zustand for app state management
- Expo SQLite for local persistent data
- AsyncStorage for persisting lightweight settings
- Lucide React Native for icons
- React Native Reanimated for motion and transitions

## Core Features

### 1. Home Dashboard

The dashboard gives a quick overview of the user’s financial activity.

Included:

- current net worth / balance summary
- total monthly income
- total monthly expenses
- month-over-month growth indicator
- weekly spending chart for the last 7 days

Goal:

- present important financial signals without making the screen feel crowded

### 2. Transaction Tracking

Users can manage day-to-day financial entries through a dedicated add flow and history screen.

Implemented:

- add transaction
- view transaction history
- edit transaction
- delete transaction
- search transactions by note or category
- filter transactions by type and category

Transaction fields:

- amount
- type (`income` or `expense`)
- category
- date
- note / description

### 3. Goal or Challenge Feature

The app includes both a savings-goal flow and an engaging monthly challenge concept.

Implemented:

- create savings goals
- track current saved amount versus target amount
- update goal funding using an `Add Funds` flow
- dynamic no-spend monthly challenge
- challenge streak tracking
- monthly no-spend progress tracking
- milestone cards driven by actual app data

### 4. Insights Screen

The insights screen helps users understand patterns in a compact mobile layout.

Included:

- current period savings
- savings rate
- fixed vs variable spend breakdown
- category-based spending analysis
- comparison with the previous period
- smart summary insight text

Available periods:

- weekly
- monthly
- yearly

### 5. Smooth Mobile UX

The app is designed with mobile-first interaction patterns.

Included:

- tab-based navigation
- dedicated add flow
- modal-based editing and filtering
- custom date picker flow
- loading states
- empty states
- error states
- touch-friendly controls and spacing

### 6. Local Data Handling

The project uses a local-first data model.

Approach:

- SQLite stores transactions and goals
- AsyncStorage stores lightweight settings such as theme, currency, biometrics, and notification preferences

This keeps the main financial records persistent on-device while still making settings easy to restore.

### 7. Code Structure and State Management

The project is organized to separate screen UI, reusable components, and data/business logic.

Included:

- screen-based app routing
- reusable UI primitives in `components/`
- centralized finance state in Zustand
- DB helpers in `services/`
- theme and category constants in `constants/`

## Optional Enhancements Included

The app also includes a few non-mandatory improvements:

- dark mode and light mode support
- biometric lock
- local notifications / reminders
- CSV export support
- multi-currency conversion
- animated transitions
- profile/settings screen

## Project Structure

```text
app/
  _layout.tsx                 Root app layout and startup flow
  (tabs)/
    index.tsx                 Home dashboard
    add.tsx                   Add transaction flow
    history.tsx               Transaction history, edit, filter, search
    goals.tsx                 Goals, challenge, milestones
    insights.tsx              Insights and analysis
    profile.tsx               Settings and account features

components/
  AppComponents.tsx           Reusable cards, buttons, typography helpers

constants/
  Theme.ts                    Theme system
  Categories.ts               Predefined categories

services/
  db.ts                       SQLite helpers
  notifications.ts            Notification permissions and scheduling

store/
  useFinanceStore.ts          Zustand store, async actions, app state
```

## Setup Instructions

### Prerequisites

Make sure you have:

- Node.js installed
- npm installed
- Expo-compatible mobile simulator or Expo Go on a device

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root if you want to enable live currency conversion:

```env
EXPO_PUBLIC_EXCHANGE_RATE_API_KEY=your_api_key_here
```

Notes:

- the app can still run without this key
- without the key, multi-currency conversion may not function fully

### Run the App

Start the Expo development server:

```bash
npm run start
```

Then run one of:

```bash
npm run android
npm run ios
npm run web
```

## How Data Works

### Transactions and Goals

- stored locally in SQLite
- loaded into Zustand on initialization
- recalculated after add, edit, delete, or update actions

### Settings

- persisted with AsyncStorage
- includes theme, currency, biometrics, and notification preferences

### Derived Metrics

The following values are calculated from the stored transaction data:

- net worth
- current month income
- current month expenses
- weekly chart values
- savings rates
- challenge progress
- milestone unlocks

## Product Decisions and Assumptions

Some product choices were made intentionally where the assignment left room for interpretation.

### Assumptions

- the app is for a single user on a personal device
- authentication is local-only, not account-based
- the app is not connected to a bank or payment provider
- financial records are manually entered by the user
- SQLite is enough for persistence because the assignment does not require cloud sync

### UX Decisions

- tab navigation was chosen for fast movement between key areas
- the add flow was kept focused and mobile-friendly instead of using a large multi-section form
- the challenge feature was integrated into the goals area to keep the product cohesive
- insights are intentionally simple and readable on small screens rather than analytics-heavy

### Scope Decisions

- a local-first solution was prioritized over backend integration
- charts and insights are lightweight and data-driven rather than using a complex analytics stack
- settings features such as biometrics and reminders were included as product polish rather than core dependencies

## Mapping to Assignment Requirements

### Home Dashboard

Implemented:

- current balance / net worth
- total income
- total expenses
- overview trend metric
- weekly spending chart

### Transaction Tracking

Implemented:

- add
- view history
- edit
- delete
- search
- filter

### Goal or Challenge Feature

Implemented:

- savings goals
- goal funding updates
- no-spend challenge
- streak tracking
- milestone system

### Insights Screen

Implemented:

- spending by category
- highest spending category
- current vs previous period comparison
- savings rate
- breakdown of fixed / variable / savings

### Smooth Mobile User Experience

Implemented:

- navigation flow
- custom form handling
- loading states
- error states
- empty states
- touch-friendly layout and controls

### Local Data Handling

Implemented:

- SQLite persistence
- AsyncStorage for settings

### Code Structure and State Management

Implemented:

- reusable components
- Zustand-based state management
- screen/component separation
- services for persistence and notifications

## Current Limitations

This is an assessment-focused project rather than a production banking app.

Known limitations:

- no cloud sync or authentication backend
- custom date picker instead of a native calendar package
- no real bank API integration
- notifications and biometric behavior may vary by platform/device support
- currency conversion depends on an external API key

## Quality and Evaluation Notes

This project was built to demonstrate:

- product thinking through a coherent finance companion concept
- mobile UX decisions rather than desktop-style dashboard design
- clear state and persistence handling
- readable project structure
- practical feature completeness with thoughtful polish

## Verification

TypeScript validation used during development:

```bash
npx tsc --noEmit
```

## Submission Notes

If this project is submitted for assessment, the intended highlights are:

- complete finance tracking flow
- data-driven dashboard and insights
- goal and challenge integration
- local persistence with SQLite
- polished mobile interaction patterns

