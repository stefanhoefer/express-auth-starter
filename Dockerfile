FROM node:lts
WORKDIR /usr/src/app
COPY package*.json .
RUN npm install
COPY . .
# USER node
EXPOSE 8000
CMD ["npm", "run", "dev"]
