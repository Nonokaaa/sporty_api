let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');

let seanceRouter = require('./routes/seances');
let userRouter = require('./routes/users');

const { connectToDB } = require('./config/database');

// Connect to database when the application initializes
// This ensures database connection is established before any request handling
connectToDB();

// Create Express application
let app = express();

// Configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Set up routes
app.use('/seances', seanceRouter);
app.use('/users', userRouter);

// Error handling middleware
app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // respond with error
  res.status(err.status || 500);
  res.json({ error: err.message });
});

// Only start server if this script is executed directly (not required as a module)
if (require.main === module) {
  const port = process.env.PORT || 3001;
  
  // Server now starts independently of database connection
  // The database connection is already established at the top of the file
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

module.exports = app;