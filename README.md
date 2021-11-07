# Travel


## CS-157A project - Travel Oasis


### Languages used:
- - -

- ##### HTML
- ##### CSS
- ##### JAVASCRIPT
- ##### Node.Js
- ##### Node Package Module (NPM)


### Software Used:
- - -

- ##### Docker #####
- ##### Oracle Database #####
- ##### SQL Developer #####

### NPM Packages used:
- - -

- ##### EJS
- ##### Path
- ##### mkdirp
- ##### oracledb
- ##### Express

### Description:
- - -

  Our team has created a web application known as Travel Oasis. It consists of 6 web pages which are registration, login, profile, place, addfriend, and allplaces. As Instagram tries to focus more on photos, Yelp focuses on reviews and Expedia focuses more on transportation, we wanted to make something which would have all these things in a single application. So, we designed our app Travel Oasis to provide all these information/services in a single place in the form of an amazing web-application. The users can comment on the photos of different locations uploaded by their fellow users. They can write reviews. Transportation information is available of most of the different locations which can be checked out on our website. Overall, users can look at all the different places of the world and get an overview of their trip using Travel Oasis. Additionally, we have added features that let them add friends and also allow them to add places to their wishlist which they would like to visit in future. 



### `Setup/ Installation Requirements:`
- - -

 First of all we need to setup ***Oracle Database***. For that, we first need to connect oracle database with sql developer through Docker.

 Code to write on terminal after opening the Docker application:
 ```
docker pull epiclabs/docker-oracle-xe-11g
```

 ```
  docker run -d -p 1521:1521 epiclabs/docker-oracle-xe-11g
```

To check the root:
```
docker ps
```

To execute the code

```
docker exec –it < your hash code/ container name> /bin/bash
```

To run the sql commands:
```
sqlplus system/oracle@//localhost:1521/xe
```

After that, open sql connector application. Create the sql connect manually. Than write the following information

- username: system
- password: oracle

Other than this, we also need to install Oracle Client. The software needs to be downloaded from the following link:

```
https://www.oracle.com/database/technologies/instant-client/macos-intel-x86-downloads.html
```



After installing the software, the following insructions need to be written on the terminal to complete the process:



```
cd $HOME/Downloads
curl -O https://download.oracle.com/otn_software/mac/instantclient/198000/instantclient-basic-macos.x64-19.8.0.0.0dbru.dmg
hdiutil mount instantclient-basic-macos.x64-19.8.0.0.0dbru.dmg
/Volumes/instantclient-basic-macos.x64-19.8.0.0.0dbru/install_ic.sh
hdiutil unmount /Volumes/instantclient-basic-macos.x64-19.8.0.0.0dbru

```
**`Note:`** The following instructions are for MacOS operating system. The setup process for other operating system might be different. Also there are many other alternative way to do the setup for oracle client.


After this process, you will be able to connect with oracle database and the application very easily.


Here is the following link to do setup in other alternative ways for all the operating systems:
```
http://oracle.github.io/node-oracledb/INSTALL.html#instosx
```

Now to insert and create table data. we need to copy certain sql files as follows:
```
docker cp /Users/..(file path)/createdb.sql root:/  
docker cp /Users/..(file path)/insert.sql root:/  

``` 
**Example: docker cp Desktop/Travel/createdb.sql 24b1f7bb3557:/**   
**Example: docker cp Desktop/Travel/insert.sql 24b1f7bb3557:/**

After that, we need to execute docker again and run sql commands. When the command SQL> shows up, we need to write following code:

```
@createdb.sql
@insert.sql
```

After that, we just need to clone the project
Need to go under the directory Travel and run the following command in the terminal:

```
npm install express;  
```

```
npm install ejs;
```

```
npm install oracledb;
```
```
npm install path;
```

```
npm install mkdirp;
```

The above following commands will add the required NPM  package required for our application.

After this we just need to write:

```
node server.js;
```
Now you can go to Google Chrome and open our website by writing localhost and the following port.

**`Note:`** If you are already using the given port for another website than it might not work. You either need to change the port number.
