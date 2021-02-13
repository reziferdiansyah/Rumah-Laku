var express = require('express');
var router = express.Router();
var path = require('path');
const bcrypt = require('bcrypt');
var url = require('url');
const saltRounds = 10;
const fileUpload = require('express-fileupload');

router.use(fileUpload())

module.exports = function (pool) {
  /* GET home page. */

  //CORDINATE 
  router.get('/coordinate', (req, res) => {
    var sql = "SELECT coordinate FROM iklan";
    pool.query(sql, (err, result) => {
      if (err) {
        res.send('Gagal')
      } else {
        res.json({
          data: result.rows
        })
      }
    })
  })

  //REGISTER
  router.post('/register', function (req, res, next) {
    if (req.body.password != req.body.repassword) {
      req.flash('info', 'password doesnt match') //set
    }
    pool.query('select * from users where email= $1', [req.body.email], (err, data) => {
      if (err) {
        req.flash('info', 'try again later')
      }
      if (data.rows.lenght > 0) {
        req.flash('info', 'try again later')
      }
      bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        if (err) {
          req.flash('info', 'email alredy exist')
        }
        pool.query(`insert into users(username,email, password,no_tlp) values ($1, $2, $3, $4)`, [req.body.username, req.body.email, hash, req.body.notelepon], (err, data) => {
          if (err) {
            req.flash('info', 'try again later')

          }
          req.flash('info', 'you have registered please sign in')
          res.json({ msg: 'success' })
        })
      });
    })
  });


  //LOGIN
  router.post('/login', function (req, res, next) {
    const { email, password } = req.body
    pool.query(`select * from users where email = '${email}'`, (err, data) => {
      if (err) return res.json('error')
      if (data.rows.length !== 0) {
        bcrypt.compare(password, data.rows[0].password, function (err, result) {
          if (err) {
            res.json({ msg: 'Email dan/atau password salah' })
          } else {
            let user = data.rows[0]
            req.session.user = user;
            req.session.loggedIn = true;
            res.json({ msg: 'success' })
          }
        }
        )
      } else {
        res.json({ msg: 'Email belum terdaftar' })
      }

    })
  })

  //COMPARE
  router.get('/compare/:id', (req, res) => {
    var { id } = req.params;
    let rep = id.split('+').join(',')
    var sql = `SELECT * FROM iklan WHERE id IN (${rep})`;
    pool.query(sql, (err, result) => {
      if (err) {
        res.send('Gagal memuat data iklan')
      } else {
        res.json(result.rows)
      }
    })
  })


  //PAGENATION
  router.get('/:page', function (req, res, next) {
    const search = req.query.search
    pool.query('SELECT lokasi FROM iklan', (err, result_lok) => {
      const result = result_lok.rows
      let lokasi = []
      let isLok = false
      result.forEach(item => {
        if (search && item.lokasi.toLowerCase().includes(search.toLowerCase())) {
          lokasi.push(item.lokasi)
          isLok = true
        }
      });
      let coord = []
      const per_page = 3;
      const page = req.params.page || 1;
      const queryObject = url.parse(req.url, true).search;
      let params = [];
      if (search && Number(search)) {
        params.push(`harga = '${search}'`)
      }
      if (search && Number(search)) {
        params.push(`harga = '${search}'`)
      }
      if (search && Number(search)) {
        params.push(`id = '${search}'`)
      }
      if (search && isLok) {
        if (lokasi.length > 0) {
          let locs = ''
          for (let i = 0; i < lokasi.length; i++) {
            locs += ` lokasi = '${lokasi[i]}' ${i == lokasi.length - 1 ? "" : "OR"}`
          }
          params.push(`${locs}`)
        } else {
          params.push(lokasi)
        }

      }
      if (search) {
        params.push(`foto = '${search}'`)
      }
      var sql = `SELECT * FROM iklan`;
      if (params.length > 0) {
        sql += ` WHERE `;
        for (let i = 0; i < params.length; i++) {
          sql += `${params[i]}`;
          if (params.length != i + 1) {
            sql += ` OR `;
          }
        }
      }
      // const sql = 'SELECT * FROM iklan ORDER BY id ASC';
      pool.query(sql, (err, rows) => {
        if (err) { res.status(400).json({ "error": err.message }); return; }
        let rowsRes = rows.rows
        rowsRes.forEach(item => {
          coord.push(item.coordinate)
        });
        sql += ` ORDER BY id DESC LIMIT 3 OFFSET ${(page - 1) * per_page} `;
        pool.query(sql, (err, data) => {
          if (err) { res.status(400).json({ "error": err.message }); return; }
          // res.json(rowsFilt.rows);
          res.status(200).json({
            coord: coord,
            data: data.rows,
            current: page,
            filter: queryObject,
            next_page: parseInt(page) + 1,
            previous_page: parseInt(page) - 1,
            pages: Math.ceil(rows.rows.length / per_page)
          });
        });
      })
    });
  })


  //DETAIL
  router.get('/detail/:id', (req, res) => {
    var { id } = req.params;
    var sql = `SELECT i.*, u.username, u.no_tlp FROM iklan as i LEFT JOIN users as u ON i.id_users = u.id WHERE i.id = ${id}`;
    pool.query(sql, (err, result) => {
      let coord = result.rows.coordinate
      if (err) {
        res.send('Gagal memuat data iklan')
      } else {
        res.json({
          data: result.rows,
          coord: coord
        })

      }
    })
  })

  //SEWA
  router.get('/:page/kategori=sewa', function (req, res, next) {
    const per_page = 3;
    const page = req.params.page || 1;
    const queryObject = url.parse(req.url, true).search;
    let sql = `SELECT * FROM iklan WHERE isJual = false `
    pool.query(sql, (err, data) => {
      if (err) return err
      sql += `ORDER BY id ASC LIMIT 3 OFFSET ${(page - 1) * per_page} `
      pool.query(sql, (err, rows) => {
        if (err) { res.status(400).json({ "error": err.message }); return; }
        // res.json(rowsFilt.rows);
        res.status(200).json({
          data: rows.rows,
          current: page,
          filter: queryObject,
          next_page: parseInt(page) + 1,
          previous_page: parseInt(page) - 1,
          pages: Math.ceil(data.rows.length / per_page)
        });
      });
    })
  });


  //JUAL
  router.get('/:page/kategori=jual', function (req, res, next) {
    const per_page = 3;
    const page = req.params.page || 1;
    const queryObject = url.parse(req.url, true).search;
    let sql = `SELECT * FROM iklan WHERE isjual = true `
    pool.query(sql, (err, data) => {
      if (err) return err
      sql += `ORDER BY id ASC LIMIT 3 OFFSET ${(page - 1) * per_page} `
      pool.query(sql, (err, rows) => {
        if (err) { res.status(400).json({ "error": err.message }); return; }
        // res.json(rowsFilt.rows);
        res.status(200).json({
          data: rows.rows,
          current: page,
          filter: queryObject,
          next_page: parseInt(page) + 1,
          previous_page: parseInt(page) - 1,
          pages: Math.ceil(data.rows.length / per_page)
        });
      });
    })
  })


  //UPLOAD
  router.post('/upload', function (req, res) {
    var { lokasi, harga, coordinate, isNego, kategori, mandi, tidur, tanah, id_users, deskripsi } = req.body;
    // console.log(isNego)
    // console.log(kategori)
    function makeid(length) {
      var result = '';
      var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      var charactersLength = characters.length;
      for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
    }

    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    today = mm + '_' + yyyy;

    let __dirname = '/home/rezi/Desktop/Batch24/RumahLaku/public/images/upload/'

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.send("Gagal")
    }
    var filename = []
    let sizeFiles = Object.keys(req.files.sampleFile).length;

    for (let i = 0; i < sizeFiles; i++) {
      // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
      let foto = req.files.sampleFile[i];
      filename.push(today + '_' + makeid(10) + i + '.jpg');
      // Use the mv() method to place the file somewhere on your server
      foto.mv(path.join(__dirname + filename[i]), function (err) {
        if (err) return err
      })
    }
    const filenameRen = filename.join(',');
    var sql2 = `INSERT INTO iklan (lokasi, coordinate,jml_kamar, isnego,foto,harga,isjual,id_users,deskripsi,luas_tanah, jml_mndi) VALUES ('${lokasi}', '${coordinate}', ${tidur}, ${isNego = 'nego' ? true : false},'${filenameRen}', ${harga}, ${kategori == 'jual' ? true : false}, ${Number(id_users)},'${deskripsi}', ${tanah}, ${mandi})`
    pool.query(sql2, (err, result) => {
      if (err) {
        console.log(err)
      } else {
        res.redirect('/')
      }
    })

  });
  //END UPLOAD

  return router;
}