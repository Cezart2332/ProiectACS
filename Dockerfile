FROM node:22-slim

WORKDIR /usr/src/app

COPY . .

RUN npm install

EXPOSE 4173

CMD npm run build && npm run preview

