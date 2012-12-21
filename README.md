See TODO.txt.

Instructions:
Create config.json with the following contents
```json
{
    "database": {
        "type": "mysql",
        "user": "user",
        "password": "pass",
        "host": "localhost",
        "database": "teamsync"
    }
}
```

Install dependencies: npm install
Create database: npm run-script setup
Run service: npm start
