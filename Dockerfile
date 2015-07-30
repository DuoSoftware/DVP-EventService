FROM ubuntu
RUN apt-get update
RUN apt-get install -y git nodejs npm
RUN git clone git://github.com/DuoSoftware/DVP-EventService.git /usr/local/src/eventservice
RUN cd /usr/local/src/eventservice; npm install
CMD ["nodejs", "/usr/local/src/eventservice/app.js"]

EXPOSE 8823