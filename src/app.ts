import * as path from 'path';
import express, { Application } from 'express';
import users from './Router/userRouter';
import articleTypes from './Router/articleTypeRouter';
import glossary from './Router/GlossaryRouter';
import article from './Router/ArticleRouter';
// @ts-ignore
// import front from '../build';
const app: Application = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
app.get('/series', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
app.get('/categories', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
app.get('/administration', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
app.use('/', users);
app.use('/', articleTypes);
app.use('/', glossary);
app.use('/', article);

export default app;
