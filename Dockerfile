FROM node:14-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . ./

# resulting image
FROM node:14-alpine

WORKDIR /app
COPY --from=builder /app ./

CMD ["/usr/local/bin/npm", "start"]
