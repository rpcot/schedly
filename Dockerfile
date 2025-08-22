FROM node:18.20.5

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY src ./src

EXPOSE 4444

CMD if [ "$NODE_APP" = "api" ]; then yarn start:api; else yarn start; fi