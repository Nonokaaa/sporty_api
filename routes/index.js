let express = require('express');
let router = express.Router();

let Livre = require('../models/Livre');
const auth = require('../middlewares/auth');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/dashboard', auth, async function(req, res, next) {
  try {
    const totalBooks = await Livre.countDocuments();
    const booksByCategory = await Livre.aggregate([
      { $group: { _id: '$categorie', count: { $sum: 1 } } },
      { $project: { _id: 0, categorie: '$_id', count: 1 } }
    ]);
    res.render('dashboard', { title: 'Dashboard', totalBooks, booksByCategory});
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;
