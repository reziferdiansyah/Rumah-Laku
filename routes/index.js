var express = require('express');
var router = express.Router();
const { isLoggedIn } = require('../helpers/util')


/* GET home page. */
/* GET users listing. */
module.exports = function (pool) {
  router.get('/', isLoggedIn, function (req, res, next) {
    res.render('index', {
      user: req.session.user
    });
  });

  router.get('/login', function (req, res, next) {
    res.render('login');
  });

  router.get('/detail', function (req, res, next) {
    res.render('detail', {
      user: req.session.user,
      isLogin: req.session.loggedIn,
      title: 'Express',
    });
  });

  router.get('/register', function (req, res, next) {
    res.render('register', { info: req.flash('info') }); //get
  });

  router.get('/logout', function (req, res, next) {
    req.session.destroy(function (err) {
      res.redirect('/login')
    })
  });
  
  router.get('/kategori=sewa', function (req, res, next) {
    res.status(200).render('sewa', {
      user: req.session.user,
      isLogin: req.session.loggedIn
    })
  });

  router.get('/kategori=jual', function (req, res, next) {
    res.status(200).render('jual', {
      user: req.session.user,
      isLogin: req.session.loggedIn
    })
  });

  router.get('/upload',isLoggedIn, function (req, res, next) {
    console.log(req.session.user)
    res.render('upload', {
      user: req.session.user
    });
  });  

  router.get('/compare', function (req, res, next) {
    res.render('compare', {
      title: 'Compare Pages'
    })
  })
  return router
}
