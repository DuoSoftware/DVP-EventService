#FROM ubuntu
#RUN apt-get update
#RUN apt-get install -y git nodejs npm
#RUN git clone git://github.com/DuoSoftware/DVP-EventService.git /usr/local/src/eventservice
#RUN cd /usr/local/src/eventservice; npm install
#CMD ["nodejs", "/usr/local/src/eventservice/app.js"]

#EXPOSE 8823

FROM node:argon
RUN git clone git://github.com/DuoSoftware/DVP-EventService.git /usr/local/src/eventservice
RUN cd /usr/local/src/eventservice;
WORKDIR /usr/local/src/eventservice
RUN npm install
EXPOSE 8823
CMD [ "node", "/usr/local/src/eventservice/app.js" ]
