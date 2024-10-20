# Omegle Clone

An Omegle-like video chat platform built using Next.js, Agora RTC, Agora RTM, and MongoDB. This project allows users to randomly connect with others, join a chat room, and communicate via video and audio streams.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
  - [Start Chatting](#start-chatting)
  - [Video and Audio](#video-and-audio)
  - [Messaging](#messaging)
  - [Next Room](#next-room)
- [Backend API](#backend-api)
- [Known Issues](#known-issues)
- [Contributing](#contributing)
- [License](#license)

## Features

- Random chat room creation and matching.
- Video and audio streaming using Agora RTC.
- Real-time messaging using Agora RTM.
- Room management (create, join, and leave rooms).
- Integrated with MongoDB for room status tracking.

## Tech Stack

- **Frontend**: Next.js, React
- **Real-Time Communication**: Agora RTC, Agora RTM
- **Backend**: Node.js, Express.js (via Next.js API routes)
- **Database**: MongoDB (via Mongoose)

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/abhi-ram-s/web-programming-project.git
    cd omegle-clone
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Set up environment variables (see below).

4. Run the development server:
    ```bash
    npm run dev
    ```

5. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Environment Variables

Create a `.env` file in the root of your project and add the following environment variables:

```bash
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id
MONGODB_URI=your_mongodb_connection_string
AGORA_APP_CERT=your_agora_primary_certificate_key
```
