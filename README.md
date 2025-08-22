<p align="center">
  <a href="https://schedule.rpcot.ru/info"><img src="https://api.rpcot.ru/images/rasp-logo" alt="лого" /></a>
</p>

# SCHEDLY

Telegram bot and site to conveniently view and manage school schedules and homework.

## About the project

- This bot helps you quickly get the latest schedule and homework updates.
- The bot saves all previous data, shows the current week and the next two weeks.
- The schedule is filled in by students, so you can specify all the details: homework, tests, class cancellations, extracurricular activities, and more.

## What you can manage in the bot

- Add, delete, and reschedule homework  
- Add, delete, cancel, and reschedule lessons  
- Extracurricular events and notes for specific days  
- Change the bell schedule  
- Change the classrooms where lessons take place  
- Mark a day as a day off  
- Display start and end times of lessons  
- Record quizzes, exams, tests, and other types of assessments

## Main commands

- /start — greeting and brief info  
- /help — list of commands  
- /site the website  
- /today — schedule for today  
- /tomorrow — schedule for tomorrow

## Running the project

Clone the repository:  
```bash
git clone https://github.com/rpcot/schedly.git
cd schedly
```

### Install with Docker
1. Build and start the containers
```bash
docker compose up --build -d
```

### Install without Docker
1. Install yarn if you don't have it:
```bash
npm install --global yarn
```

2. Install dependencies:
```bash
yarn install
```

3. Start the bot:
```bash
yarn start
```

4. Start the API:
```bash
yarn start:api
```