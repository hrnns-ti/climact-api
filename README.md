# ClimACT API 🌱

**RESTful API service powering the ClimACT climate action platform**

> *Turning climate intentions into measurable actions through robust backend infrastructure*

## 📋 Overview

This backend service provides the core functionality for Climact - a gamified climate action platform that helps users track sustainability tasks, reduce carbon footprint, and participate in environmental challenges.
#
### 🎯 Core Modules

**🔐 Authentication & User Management** - Secure user accounts and profiles with role-based access  
**📋 Task Engine** - Dynamic daily/weekly climate action challenges  
**🏆 Gamification System** - Points, achievements, and progress tracking  
**📊 Analytics Engine** - Carbon footprint calculations and impact metrics  
**👥 Community Features** - Events, groups, and social interactions  

#
###  📈 Progress

| Core Module                         | Description                                              | Status      |
|-------------------------------------|----------------------------------------------------------|-------------|
| 🔐 Authentication & User Management | Secure user accounts and profiles with role-based access | 🚧 **Dev**  |
| 📋 Task Engine                      | Dynamic daily/weekly climate action challenges           | ✅ **Done** |
| 🏆 Gamification System              | Points, achievements, and progress tracking              | 🚧 **Dev**  |
| 📊 Analytics Engine                 | Carbon footprint calculations and impact metrics         | 🚧 **Dev**  |
| 👥 Community Features               | Events, groups, and social interactions                  | 🚧 **Dev**  |
| -                                   | -                                                        | 🚧 **Dev**  |


### 🔐 Authentication and Users

| Method         | Endpoint               | Description                | Status       |
|----------------|------------------------|----------------------------|--------------|
| `POST`         | `/auth/register`   | Create new climate warrior | ✅ **Live**   |
| `POST`         | `/auth/login`      | User authentication        | ✅ **Live**   |
| `GET`          | `/auth/id`         | Get user profile           | 🚧 **Dev**    |
| `PUT & DELETE` | `/auth/id`         | Update user settings       | 🚧 **Dev**    |

### 📋 Task Engine

| Method   | Endpoint                | Description        | Status       |
|----------|-------------------------|--------------------|--------------|
| `GET`    | `/quests/`          | Get quests list    | ✅ **Live**   |
| `POST`   | `/quests/ `         | Create quest       | ✅ **Live**   |
| `GET`    | `/quests/id`        | Get detailed quest | ✅ **Live**   |
| `PUT `   | `/quests/id`        | Update quest       | ✅ **Live**   |
| `POST`   | `/quests/id/submit` | Submit quest       | 🚧 **Dev**    |
| `DELETE` | `/quests/id`        | Delete quest       | ✅ **Live**   |
| `GET`    | `/users/id/quests` | Quests History      | 🚧 **Dev**    |


## Authors

- [@hearunnas](https://www.github.com/hrnns-ti)



## Tech Stack
**Server:** Node, Express  
**Database:** MongoDB