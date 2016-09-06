FROM node:4-slim

ENV PORT=3000
ENV DATA_LOCATION=/data

EXPOSE 3000

WORKDIR /usr/src/app

COPY . /usr/src/app

RUN npm install --production --quiet

CMD [ "npm", "start" ]
