FROM node:4-slim

ENV PORT=3000
ENV CONFIG_LOCATION=/config
ENV MUSIC_ROOT=/media/music
ENV PLAYLIST_PATH=/media/playlists

EXPOSE 3000

WORKDIR /usr/src/app

COPY . /usr/src/app

RUN npm install --production --quiet

CMD [ "npm", "start" ]
