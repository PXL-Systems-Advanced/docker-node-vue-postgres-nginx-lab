# syntax=docker/dockerfile:1
FROM node:24-alpine
RUN apk add --no-cache git
RUN git config --system --add safe.directory /workspace
WORKDIR /workspace/frontend
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]
