
FROM node:24-alpine AS builder
WORKDIR /usr/src/app

COPY . .

RUN npm install
RUN npm run build

FROM node:24-alpine
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app ./
EXPOSE 3000