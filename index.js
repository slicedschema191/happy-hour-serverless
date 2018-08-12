const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
const AWS = require('aws-sdk');
const middy = require('middy')
const { cors } = require('middy/middlewares')


const BEERS_TABLE = process.env.BEERS_TABLE;
const REQUESTS_TABLE = process.env.REQUESTS_TABLE;
const IS_OFFLINE = process.env.IS_OFFLINE;

let dynamoDb = (IS_OFFLINE === 'true') ?
  new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8001'
  }) :
  new AWS.DynamoDB.DocumentClient();

app.use(bodyParser.json({ strict: false }));

app.get('/', function (req, res) {
  res.send('Hello World!')
})


// Get all requests endpoint
app.get('/api/requests', function (req, res) {
  const params = {
    TableName: REQUESTS_TABLE
  }

  dynamoDb.scan(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not get requests' });
    } else {
      res.json(result.Items);
    }
  });
});

// Create requests endpoint
app.post('/api/requests', function (req, res) {
  const { name, beer, quantity, sessionId, date } = req.body;
  const params = {
    TableName: REQUESTS_TABLE,
    Item: { name, beer, quantity, sessionId, date }
  };

  dynamoDb.put(params, (error) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not create request' });
    }
    res.json({ name, beer, quantity, sessionId, date });
  });
});

// Get all beers endpoint
app.get('/api/beers', function (req, res) {
  const params = {
    TableName: BEERS_TABLE
  }

  dynamoDb.scan(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not get beers' });
    } else {
      res.json(result.Items);
    }
  });
})

// Create Beer endpoint
app.post('/api/beers', function (req, res) {
  const { title, id } = req.body;

  const params = {
    TableName: BEERS_TABLE,
    Item: {
      id,
      title: title || 'TBD'
    },
  };

  dynamoDb.put(params, (error) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not create beer' });
    }
    res.json({ title, id });
  });
})

// Update Beer endpoint
app.put('/api/beers/:id', function (req, res) {
  const { id } = req.params;
  const { title } = req.body;
  console.log('ID', id);

  const params = {
    TableName: BEERS_TABLE,
    Item: {
      id,
      title: title || 'TBD'
    },
  };

  dynamoDb.put(params, (error) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not update beer' });
    }
    res.json({ title, id });
  });
});

// Delete Beer endpoint
app.delete('/api/beers/:id', function (req, res) {
  const { id } = req.params;
  console.log('ID', id);

  const params = {
    TableName: BEERS_TABLE,
    Key: {
      id
    }
  };

  dynamoDb.delete(params, (error) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not delete beer' });
    }
    res.json({ id });
  });
});

module.exports.handler = middy(serverless(app)).use(cors());
