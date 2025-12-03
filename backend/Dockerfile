FROM node:22-alpine
RUN apk add --no-cache git

# This tells Git "It's okay that root owns this folder, let me use it."
RUN git config --system --add safe.directory /workspace

# Match the working directory in compose.yaml
WORKDIR /workspace/backend

COPY package*.json ./
RUN npm install && npm cache clean --force
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]