FROM node:0.10
MAINTAINER ants <contact@ants.builders>

RUN mkdir /usr/scream-pong
WORKDIR /usr/scream-pong

RUN npm install nodemon -g

