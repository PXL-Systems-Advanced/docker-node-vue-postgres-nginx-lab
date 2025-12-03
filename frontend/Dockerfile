FROM node:22-alpine

# Install Git (needed if you want source control in frontend container too)
RUN apk add --no-cache git
# This tells Git "It's okay that root owns this folder, let me use it."
RUN git config --system --add safe.directory /workspace

# Match the working directory in compose.yaml
WORKDIR /workspace/frontend

COPY package*.json ./
RUN npm install && npm cache clean --force
COPY . .

# VITE default port
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
