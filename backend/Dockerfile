# syntax=docker/dockerfile:1
FROM node:24-alpine
RUN apk add --no-cache git
RUN git config --system --add safe.directory /workspace
WORKDIR /workspace/backend
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
