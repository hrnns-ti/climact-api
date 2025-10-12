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
| 🔐 Authentication & User Management | Secure user accounts and profiles with role-based access | ✅ **Done**  |
| 📋 Task Engine                      | Dynamic daily/weekly climate action challenges           | ✅ **Done**  |
| 🏆 Gamification System              | Points, achievements, and progress tracking              | 🚧 **Dev**  |
| 📊 Analytics Engine                 | Carbon footprint calculations and impact metrics         | 🚧 **Dev**  |
| 👥 Community Features               | Events, groups, and social interactions                  | 🚧 **Dev**  |
| -                                   | -                                                        | 🚧 **Dev**  |


### 🔐 Authentication and Users

| Method         | Endpoint               | Description                | Status       |
|----------------|------------------------|----------------------------|--------------|
| `POST`         | `/api/auth/sign-up`    | Create new climate warrior | ✅ **Live**   |
| `POST`         | `/api/auth/sign-in`    | User authentication        | ✅ **Live**   |
| `GET`          | `/api/auth/id`         | Get user profile           | ✅ **Live**   |
| `PUT & DELETE` | `/api/auth/id`         | Update user settings       | ✅ **Live**   |

### 📋 Task Engine

| Method   | Endpoint                | Description        | Status       |
|----------|-------------------------|--------------------|--------------|
| `GET`    | `/api/quests/`          | Get quests list    | ✅ **Live**   |
| `POST`   | `/api/quests/ `         | Create quest       | ✅ **Live**   |
| `GET`    | `/api/quests/id`        | Get detailed quest | ✅ **Live**   |
| `PUT `   | `/api/quests/id`        | Update quest       | ✅ **Live**   |
| `POST`   | `/api/quests/id/submit` | Submit quest       | ✅ **Live**   |
| `DELETE` | `/api/quests/id`        | Delete quest       | ✅ **Live**   |
| `GET`    | `/api/users/id/quests` | Quests History      | ✅ **Live**   |


## Authors

- [@hearunnas](https://www.github.com/hrnns-ti)



## Tech Stack
**Server:** Node, Express  
**Database:** MongoDB