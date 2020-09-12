// Coloring console.log()
const clc = require('cli-color');

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const cheerio = require('cheerio');

const config = require('./credentials.js');
const vk_api = require('./vk_api.js');
const jsonencoder = require('./json-encoder.js');

// Predefine stylings for colored console.log()
const err = clc.red.bold;
const warn = clc.yellow;
const n = clc.black.bgBlackBright;
const ok = clc.green;
const info = clc.bgRed;

const server = http.createServer(function (req, res) {
  const ip = req.socket.remoteAddress;
  const port = req.socket.remotePort;
  console.error(
    ok(`Connection established from: `) + n(`${ip}:${port}`) +
    ok('. To:') + n(req.url) + ' ' + info(req.method));
  // res.writeHead(200, { 'Content-Type': 'text/plain' });
  let txt = '';
  switch (req.url) {
    case "/test":
      txt = `<div><div>Your IP address is <h4 style="display: inline; color:#FF0000">${ip}</h4></div><div>Your source port is <h4 style="display: inline; color:#FF0000">${port}</h4></div></div>`;
      responseWrapper.call(res, txt, 200, {
        'Content-Type': 'text/html; charset=UTF-8',
        'Content-Length': Buffer.byteLength(txt)
      });
      break;
    case "/callback":
      if (req.method === 'POST') {
        let data = '';
        // Copy Buffer stream to 'data'
        req.on('data', (chunk) => {
          data += chunk;
        });
        req.on('end', () => {
          const type = req.headers['content-type'];
          if (type && type.indexOf('application/json') !== -1) {
            console.error(info('Got: "application/json"'));
            let parsed;
            try {
              parsed = JSON.parse(data);
            } catch (error) {
              if (error.name === 'SyntaxError') {
                console.error(err(error.message));
                responseWrapper.call(res, 'Invalid JSON format', 400);
                return;
              }
            }
            console.log(parsed);

            // VK.com REQUESTS
            if (parsed.type && parsed.group_id) {
              if (parsed.group_id === config.vk_group_id) {
                // Check if two-factor-authorization. 
                console.log(info('config:'), config);
                if (!config._is2FA) {
                  // If not true -> it passed; 
                  switch (parsed.type) {
                    case 'confirmation':
                      responseWrapper.call(res, config.vk_confirmation_code, 200);
                      return;
                    case 'message_new':
                      responseWrapper.call(res, 'ok', 200);

                      if (parsed.object && parsed.object.text) {
                        // Default settings for OutgoingRequests 
                        const options = {
                          method: 'GET',
                          hostname: 'vk.com',
                          headers: {
                            'Accept': '*/*',
                            'Accept-Encoding': 'gzip',
                            'Cache-Control': 'no-cache',
                            'Connection': 'close',
                            'User-Agent': 'Mozilla / 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 77.0.3865.120 Safari / 537.36',
                            'Host': 'vk.com',
                            'Cookie': config.vk_auth_cookie
                          }
                        }
                        const text = parsed.object.text.split(' ');
                        switch (text[0]) {
                          case 'list':
                            console.log(info('LIST'));

                            break;
                          case 'start':
                            console.log(info('start'));
                            vk_api.messages.setActivity(true);
                            vk_api.swag.lol();
                            break;
                          case 'test':
                            // GET /im 
                            // loads HTML page with messages
                            options.path = '/im';

                            https.get(options, (res) => {
                              console.error(info(res.statusCode));
                              console.error('headers:', res.headers);

                              let data = '';
                              res.pipe(zlib.createGunzip())
                                .on('error', (e) => {
                                  console.error(e);
                                })
                                .on('data', (chunk) => {
                                  data += chunk;
                                })
                                .on('end', () => {
                                  fs.writeFileSync('messages.html', data);
                                })
                                .on('close', () => {
                                });
                            }).on('error', (e) => {
                              console.error(err(e.message));
                            });
                            break;
                          case 'loop_typing':
                            //repeatSetActivity(1*60000, true, 113147887, true);
                            // Anya
                            //repeatSetActivity(10*60000, true, 269607362, true);
                            // Nastya
                            //repeatSetActivity(10 * 60000, true, 2947380, true);
                            // my community
                            repeatSetActivity(1 * text[1], true, text[2], text[3] === 'true');
                            //messages.setActivity(true, -187361276, true);
                            //messages.setActivity(false, 136914440, true);
                            // messages.setActivity(true, -187361276);

                            // // GET /im 
                            // // loads HTML page with messages
                            // options.path = '/im';

                            // https.get(options, (res) => {
                            //   console.error(info(res.statusCode));
                            //   console.error('headers:', res.headers);

                            //   let data = '';
                            //   res.pipe(zlib.createGunzip())
                            //     .on('error', (e) => {
                            //       console.error(e);
                            //     })
                            //     .on('data', (chunk) => {
                            //       data += chunk;
                            //     })
                            //     .on('end', () => {

                            //     })
                            //     .on('close', () => {
                            //     });
                            // }).on('error', (e) => {
                            //   console.error(err(e.message));
                            // });
                            break;
                          // default:
                          //   console.log(n('Entered wrong command in object.text'));
                          //   break;
                        }

                        if (parsed.object.text.indexOf('loop typing') !== -1) {
                          let entered = parsed.object.text.split(' ');
                          repeatSetActivity(+entered[2], true, +entered[3], true);
                        }
                      } else {
                        console.log(info('No object or object.text was found in JSON'));
                      }
                      return;
                    case 'auth':
                      responseWrapper.call(res, 'ok', 200);
                      if (!config.vk_auth_cookie) {
                        console.log("Authenticating...");
                        // Cookie must be set by calling this function
                        vkAuth();
                      }
                      //console.log(config);
                      return;
                    case 'auth_clear':
                      responseWrapper.call(res, 'ok', 200);
                      config.vk_auth_cookie = '';
                      return;
                  }
                } else {
                  //else need to get access code
                  responseWrapper.call(res, 'ok', 200);

                  if (parsed.type === 'message_new' &&
                    parsed.object && parsed.object.text) {
                    // POST /al_login.php
                    console.log(info('POST /al_login.php'));

                    console.log(n('Cookies:'), config.vk_auth_cookie);
                    let jsonBody = {
                      'act': 'a_authcheck_code',
                      'al': 1,
                      'code': parsed.object.text,
                      'hash': config._hash2FA,
                      'remember': ''
                    };

                    const body = jsonencoder.toFormUrlEncoded(jsonBody);
                    const options = {
                      method: 'POST',
                      hostname: 'vk.com',
                      path: '/al_login.php',
                      headers: {
                        'Accept': '*/*',
                        'Accept-Encoding': 'gzip',
                        'Cache-Control': 'no-cache',
                        'Connection': 'close',
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': body.length,
                        'Cookie': config.vk_auth_cookie,
                        'User-Agent': 'Mozilla / 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 77.0.3865.120 Safari / 537.36',
                        'Host': 'vk.com'
                      }
                    }
                    console.log(n('Request:'), options, body);
                    let locationTo = '';
                    const req = https.request(options, (res) => {
                      console.error(info(res.statusCode));
                      console.error('headers:', res.headers);

                      let data = '';
                      res.pipe(zlib.createGunzip())
                        .on('error', (e) => {
                          console.error(e);
                        })
                        .on('data', (chunk) => {
                          data += chunk;
                        })
                        .on('end', () => {
                          // Set cookies: 'remixjsp' & 'remixauthcheck' = DELETED
                          console.log(data);
                          fs.writeFileSync('response.html', data);
                          console.log(res.headers['set-cookie']);

                          // Check if captcha appears
                          if (data.indexOf(config._locationTo2FA.path) !== -1) {
                            // NO CAPTCHA
                            config._isCaptcha = false;

                            // Set cookies: 'remixjsp' & 'remixauthcheck' = DELETED
                            config.vk_auth_cookie = Array.prototype.concat(
                              config.vk_auth_cookie, res.headers['set-cookie']
                            );
                          } else if (data.indexOf('6L') !== -1) {
                            // CAPTCHA
                            config._isCaptcha = true;

                            // DUNNO HOW TO SOLVE IT
                            // TODO: call function to solve reCaptcha

                          } else if (data.indexOf('SWAG') !== -1) {
                            // CAPTCHA, ?????
                            // WTF WTF WTF WTF WTF
                            // FALSE 2FA KEY ?
                          } else {
                            throw new Error(data);
                          }
                          console.log('CONFIG?');
                          console.log(config);
                        })
                        .on('close', () => {
                          if (!config._isCaptcha) {
                            console.log(info('NO CAPTCHA & 2FA PASSED'));
                            // NO 2FA
                            config._is2FA = false;

                            // HERE WE GO AGAIN
                            // GET vk.com/login.php?act=slogin&to=&s=1&__q_hash=3ca3fa6a10ac7a4cb7ae7866c2d0ef60&fast=1
                            const options = {
                              method: 'GET',
                              hostname: config._locationTo2FA.host,
                              path: config._locationTo2FA.path + '&fast=1',
                              headers: {
                                'Accept': '*/*',
                                'Accept-Encoding': 'gzip',
                                'Cache-Control': 'no-cache',
                                'Connection': 'close',
                                'User-Agent': 'Mozilla / 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 77.0.3865.120 Safari / 537.36',
                                'Host': 'vk.com'
                              }
                            }
                            https.get(options, (res) => {
                              console.error(info(res.statusCode));
                              console.error('headers:', res.headers);
                              // Set final response cookies
                              config.vk_auth_cookie = res.headers['set-cookie'];

                              let data = '';
                              res.pipe(zlib.createGunzip())
                                .on('error', (e) => {
                                  console.error(e);
                                })
                                .on('data', (chunk) => {
                                  data += chunk;
                                })
                                .on('end', () => {
                                  // In response we get redirection to '/'
                                  // but we will go right to '/feed'
                                  // to test the functionality
                                  console.log(err(data));
                                  if (res.headers['location'] === '/' &&
                                    res.statusCode === 302) {
                                    console.log(info('FOUND FINAL REDIRECT TO / '));
                                  } else {
                                    throw new Error(`No location was found in response to 'vk.com/login.php?...._q_hash=...'`);
                                  }
                                })
                                .on('close', () => {
                                  // GET vk.com/feed
                                  // to get final HTML authorized page
                                  const options = {
                                    method: 'GET',
                                    hostname: 'vk.com',
                                    path: '/feed',
                                    headers: {
                                      'Accept': '*/*',
                                      'Accept-Encoding': 'gzip',
                                      'Cache-Control': 'no-cache',
                                      'Connection': 'close',
                                      'Cookie': config.vk_auth_cookie,
                                      'User-Agent': 'Mozilla / 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 77.0.3865.120 Safari / 537.36',
                                      'Host': 'vk.com'
                                    }
                                  }

                                  https.get(options, (res) => {
                                    console.error(info(res.statusCode));
                                    console.error('headers:', res.headers);

                                    let data = '';
                                    res.pipe(zlib.createGunzip())
                                      .on('error', (e) => {
                                        console.error(e);
                                      })
                                      .on('data', (chunk) => {
                                        data += chunk;
                                      })
                                      .on('end', () => {
                                        fs.writeFileSync('feed.html', data);
                                        //console.log(data);
                                      })
                                      .on('close', () => {
                                        return;
                                      });
                                  })
                                    .on('error', (e) => {
                                      console.error(err(e.message));
                                    })
                                    .on('close', () => {
                                      setTimeout(() => {
                                        // TODO: SEND RESPONSE MESSAGE TO DIALOG TO USER
                                        // ABOUT
                                        // 'You have successfully authorized'
                                      }, 1000);
                                    });
                                });
                            })
                              .on('error', (e) => {
                                console.error(err(e.message));
                              });
                            return;
                          } else {
                            console.log(info('CAPTCHA'));
                            return;
                          }
                        });
                    });
                    req.on('error', (e) => {
                      console.error(e);
                    });
                    req.write(body);
                    req.end();
                    // MAY BE RETURN;
                    return;
                  } else {
                    // TODO: SEND RESPONSE MESSAGE TO DIALOG TO USER
                    // ABOUT SEEEEEEED ME THE FUCKING code
                    // someFunction()
                    // FOR SECOND TIME!!!
                    console.log(
                      n(`GIVE ME THE FUCKING 2FA CODE 
                      next message!`)
                    );
                    return;
                  }
                }
              } else {
                responseWrapper.call(res, 'ok', 200);
                console.error(info('Incorrect group_id'));
                return;
              }
            }

            // Leha's REQUESTS
            if (parsed['path']) {
              let files, error, searchDir = parsed.path;

              function isFile(fileName) {
                let type;
                try {
                  type = Number(fs.lstatSync(fileName).isFile());
                } catch (e) {
                  error = 'Errors with lstatSync';
                  console.log(e.message);
                }
                return type;
              }

              try {
                files = fs.readdirSync(searchDir)
                  .map(function (fileName) {
                    fileName = path.join(searchDir, fileName);
                    return {
                      name: fileName,
                      isFile: isFile(fileName)
                    }
                  });
              } catch (e) {
                error = e.message;
                console.log(e.message);
              }

              let data = {
                files: files,
                error: error
              }

              // { files:
              //   [ { name: 'C:\\$Recycle.Bin', isFile: 0 },
              //     { name: 'C:\\bootTel.dat', isFile: 1 },
              //     { name: 'C:\\Config.Msi', isFile: undefined },
              //     { name: 'C:\\Documents and Settings', isFile: 0 },
              //     { name: 'C:\\hiberfil.sys', isFile: undefined },
              //     { name: 'C:\\Intel', isFile: 0 },
              //     { name: 'C:\\MSOCache', isFile: 0 },
              //     { name: 'C:\\pagefile.sys', isFile: undefined },
              //     { name: 'C:\\PerfLogs', isFile: 0 },
              //     { name: 'C:\\Program Files', isFile: 0 },
              //     { name: 'C:\\Program Files (x86)', isFile: 0 },
              //     { name: 'C:\\ProgramData', isFile: 0 },
              //     { name: 'C:\\PUBGLite', isFile: 0 },
              //     { name: 'C:\\Recovery', isFile: 0 },
              //     { name: 'C:\\swapfile.sys', isFile: undefined },
              //     { name: 'C:\\System Volume Information', isFile: 0 },
              //     { name: 'C:\\Users', isFile: 0 },
              //     { name: 'C:\\Windows', isFile: 0 } ],
              //  error: 'Errors with lstatSync' }

              console.log(data);
              data = JSON.stringify(data);
              responseWrapper.call(res, data, 200, {
                'Access-Control-Allow-Origin': req.headers.origin || 'http://localhost',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'content-type',
                'Content-Type': 'application/json; charset=UTF-8',
                'Content-Length': data.length
              })
              return;
            }
          } else {
            console.log(data.toString());
          }
          responseWrapper.call(res, 'ok', 200, {
            'Access-Control-Allow-Origin': req.headers.origin || 'http://localhost',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'content-type'
          });
        });
      } else if (req.method === 'OPTIONS') {
        // if it's OPTIONS request
        if (req.headers['origin']) {
          switch (req.headers.origin) {
            case 'http://localhost:5500':
            case 'http://127.0.0.1:5500':
            case 'https://fiddle.jshell.net':
              responseWrapper.call(res, 'ok', 200, {
                'Access-Control-Allow-Origin': req.headers.origin,
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'content-type'
              });
              break;
            default:
              responseWrapper.call(res, 'error', 200);
              break;
          }

        } else {
          responseWrapper.call(res, 'error', 200);
        }

      } else {
        // if not POST
        responseWrapper.call(res, 'Only POST method is allowed', 405);
      }
      break;
    default:
      txt = '<h4>404 Not Found</h4>';
      responseWrapper.call(res, txt, 404, {
        'Content-Type': 'text/html; charset=UTF-8',
        'Content-Length': txt.length
        //'Content-Length': Buffer.byteLength(txt)
      });
      break;
  }
}).listen(process.env.PORT || 5000);

function responseWrapper(message, statusCode, headers) {
  if (statusCode) {
    headers ?
      this.writeHead(statusCode, headers) : this.writeHead(statusCode);
  }
  if (message) this.write(message);
  this.end();
}

function vkAuth() {
  let hashForm = {
    'act': 'login',
    'role': 'al_frame',
    'expire': '',
    'recaptcha': '',
    'captcha_sid': '',
    'captcha_key': '',
    '_origin': 'https://vk.com',
    'ip_h': '',
    'lg_h': '',
    'ul': '',
    'email': config.vk_user_login,
    'pass': config.vk_user_pass
  };

  const options = {
    method: 'GET',
    hostname: 'vk.com',
    path: '/',
    headers: {
      'Accept': '*/*',
      'Accept-Encoding': 'gzip',
      'Cache-Control': 'no-cache',
      'Connection': 'close',
      'User-Agent': 'Mozilla / 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 77.0.3865.120 Safari / 537.36',
      'Host': 'vk.com'
    }
  };
  let resCookies;

  // 1.
  // GET vk.com/ 
  // MUST BE: 200 & HTML 'vk.com login page' & 'Set-Cookie'
  // to get 'ip_h' & 'lg_h' params from HTML <input>
  https.get(options, (res) => {
    console.error(info(res.statusCode));
    console.error('headers:', res.headers);
    resCookies = res.headers['set-cookie'];

    // 1. REQ()
    // 2. RES() -> RES.data (до конца) -> RES.end
    // 3. REQ.close
    // 4. RES.close
    // 5. GZIP.data (до конца) -> GZIP.end -> GZIP.close (если тут обработка, то вызывается PARSING)

    let data = '';
    res.pipe(zlib.createGunzip())
      .on('error', (e) => {
        console.error(err(e.message));
      })
      .on('data', (chunk) => {
        data += chunk;
      })
      .on('end', () => {
        //console.log(info('GZIP: END'));
        // Find ip_h & lg_h and set them as props to 'hashForm' object 
        parseLoginPage.call(hashForm, data);
      })
      .on('close', () => {
        //console.log(info('GZIP: CLOSE'));
        handleVkLogin(resCookies, hashForm);
      });
  }).on('error', (e) => {
    console.error(err(e.message));
  });
}

function parseLoginPage(data) {
  console.log(n('PARSING'));
  // Find ip_h & lg_h and set them as props to 'hashForm' object 
  // <input type="hidden" name="ip_h" value="2fca03cc6dd90f8339">
  // <input type="hidden" name="lg_h" value="6c8f2f0e00001a1da2">
  const $ = cheerio.load(data);
  $('form')
    .filter((idx, el) => {
      return el.attribs.id === 'quick_login_form' &&
        el.attribs.method === 'POST';
    })
    .children()
    .map((idx, el) => {
      //console.error(el.attribs);
      switch (el.attribs.name) {
        case 'ip_h':
          this.ip_h = el.attribs.value;
          break;
        case 'lg_h':
          this.lg_h = el.attribs.value;
          break;
      }
    });
}

function handleVkLogin(resCookies, hashForm) {
  // 2.
  // POST login.vk.com/?act=login
  // MUST BE: 302 & 'Location'

  //console.log(resCookies);
  const body = jsonencoder.toFormUrlEncoded(hashForm);
  const options = {
    method: 'POST',
    hostname: 'login.vk.com',
    path: '/?act=login',
    headers: {
      'Accept': '*/*',
      'Accept-Encoding': 'gzip',
      'Cache-Control': 'no-cache',
      'Connection': 'close',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': body.length,
      'Cookie': resCookies,
      'User-Agent': 'Mozilla / 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 77.0.3865.120 Safari / 537.36',
      'Host': 'login.vk.com'
    }
  }
  console.log(n('Request:'), options, body);
  const req = https.request(options, (res) => {
    console.error(info(res.statusCode));
    console.error('headers:', res.headers);
    let _location = new URL(res.headers['location']);
    // Store locationTo in config temp var config._locationTo2FA
    config._locationTo2FA = {
      host: _location.host,
      path: _location.pathname + _location.search
    }
    // To consume all of the Incoming Data
    res.resume();
    res.on('close', () => {
      // handleNextRequest
      console.log(info('BEFORE nextRequest'));
      console.log(Array.isArray(resCookies));
      resCookies = Array.prototype.concat(
        resCookies, res.headers['set-cookie']
      );
      //resCookie sres.headers['set-cookie'];
      console.log(n('IN HANDLEVKLOGIN AFTER SET NEW COOKIES TO ResCookies'))
      console.log(resCookies);
      handleVkLoginNextRequest(resCookies);
    });
  });
  req.on('error', (e) => {
    console.error(e);
  });
  req.write(body);
  req.end();
}

function handleVkLoginNextRequest(resCookies) {
  // 3.
  // GET vk.com/login.php?act=slogin&to=&s=1&__q_hash=3ca3fa6a10ac7a4cb7ae7866c2d0ef60
  // to get first cookies
  // MUST BE: 200, HTML with <script> & Set-Cookie
  const options = {
    method: 'GET',
    hostname: config._locationTo2FA.host,
    path: config._locationTo2FA.path,
    headers: {
      'Accept': '*/*',
      'Accept-Encoding': 'gzip',
      'Cache-Control': 'no-cache',
      'Connection': 'close',
      'User-Agent': 'Mozilla / 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 77.0.3865.120 Safari / 537.36',
      'Host': 'vk.com',
      'Cookie': resCookies
    }
  }
  https.get(options, (res) => {
    console.error(info(res.statusCode));
    console.error('headers:', res.headers);

    let data = '';
    let parsedObj = {};
    res.pipe(zlib.createGunzip())
      .on('error', (e) => {
        console.error(err(e.message));
      })
      .on('data', (chunk) => {
        data += chunk;
      })
      .on('end', () => {
        console.log(err(data));
        parsedObj = parseResponseScript(data, resCookies, res.headers['set-cookie']);
      })
      .on('close', () => {
        // CALL REQUEST NUMBER 4
        console.log(parsedObj);
        handleVkLogin2FA(parsedObj);
      });
  }).on('error', (e) => {
    console.error(err(e.message));
  });
}

function parseResponseScript(data, resCookies, resHeadersSetCookie) {
  // In response we get javascript file, 
  // with function .onLoginDone('/id1231212', {....}) 
  // or parent.location.href='/login?act=authcheck'

  // check if user uses two-factor-authorization
  if (data.indexOf('/login?act=authcheck') !== -1) {
    // Need to pass 2FA
    config._is2FA = true;
    console.error(n('2FA FOUND'));

    // Add cookie:'remixauthcheck' to cookies array 
    console.log(n('SWAG'));
    console.log(resCookies);
    resCookies = Array.prototype.concat(resCookies, resHeadersSetCookie);
    console.log(info('WTF'));
    console.log(resCookies);
    console.log(n('SWAG'));

    // Set url to go
    return {
      location: '/login?act=authcheck',
      cookies: resCookies
    };
  } else if (data.indexOf('onLoginDone') !== -1) {
    // find substring between commas 
    // by indexOf + shift=13 & lastIndexOf
    const lengthOnLoginDone = 13;
    // Set found substring as 'vk_user_id' path
    config.vk_user_id = data.substring(
      data.indexOf('onLoginDone') + lengthOnLoginDone,
      data.lastIndexOf('\', {')
    );
    return {
      location: config.vk_user_id,
      cookies: resCookies
    };
  } else {
    throw new Error('Unhandled exception with VK_Auth');
  }
}

function handleVkLogin2FA(parsedObj) {
  // 4.
  // go to actual page GET vk.com/id12312321 
  // or to pass 2FA GET login?act=authcheck
  console.log(n(parsedObj.location));
  console.log(parsedObj.cookies);

  const options = {
    method: 'GET',
    hostname: 'vk.com',
    headers: {
      'Accept': '*/*',
      'Accept-Encoding': 'gzip',
      'Cache-Control': 'no-cache',
      'Connection': 'close',
      'User-Agent': 'Mozilla / 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 77.0.3865.120 Safari / 537.36',
      'Host': 'vk.com',
      'Cookie': parsedObj.cookies
    }
  }

  if (!config._is2FA) {
    // 5.A.
    // Then GET vk.com/im
    // to test the successful login
    options.path = '/im';

    https.get(options, (res) => {
      console.error(info(res.statusCode));
      console.error('headers:', res.headers);
      // Add new cookies to the existing array of cookies
      Array.prototype.concat(resCookies, res.headers['set-cookie']);
      // To prevent reauthorization
      config.vk_auth_cookie = resCookies;

      let data = '';
      res.pipe(zlib.createGunzip())
        .on('error', (e) => {
          console.error(err(e.message));
        })
        .on('data', (chunk) => {
          data += chunk;
        })
        .on('end', () => {
          fs.writeFileSync('messages_with_second_auth.html', data);
        })
        .on('close', () => {
          console.log(err(config.vk_auth_cookie));
        });
    }).on('error', (e) => {
      console.error(err(e.message));
    });
  } else {
    // 5.B.
    // Then GET login?act=authcheck to pass 2FA
    // actually gets HTML with <input>CODE</>
    options.path = parsedObj.location;

    console.log('Request 5.B: ', options);
    https.get(options, (res) => {
      console.error(info(res.statusCode));
      console.error('headers:', res.headers);
      // Add new cookies to the existing array of cookies
      // 'remixsts', 'remixjsp' = DELETED
      // and to prevent reauthorization
      if (res.headers['set-cookie']) {
        config.vk_auth_cookie =
          Array.prototype.concat(parsedObj.cookies, res.headers['set-cookie']);
      } else {
        config.vk_auth_cookie = parsedObj.cookies;
      }
      console.log(info('CURRENT CONFIG.VK_AUTH_COOKIE:'));
      console.log(config.vk_auth_cookie);

      // TODO: SEND RESPONSE MESSAGE TO DIALOG TO USER
      // ABOUT authorization code
      // someFunction() for FIRST TIME
      // 'Give me some code'

      let data = '';
      res.pipe(zlib.createGunzip())
        .on('error', (e) => {
          console.error(err(e.message));
        })
        .on('data', (chunk) => {
          data += chunk;
        })
        .on('end', () => {
          //console.log(data);
          fs.writeFileSync('authCheck.html', data);
          // need to find some hash like that: 1571304690_24ea08dc6e3c561ec1
          const re2FA = /act: 'a_authcheck_sms', hash: '(.*)'/
          config._hash2FA = data.match(re2FA)[1];
        })
        .on('close', () => {
          console.log(err(config.vk_auth_cookie));
        });
      // GOTO: START
    }).on('error', (e) => {
      console.error(err(e.message));
    });
  }
}

function repeatSetActivity(endTime) {
  let args = Array.prototype.slice.call(arguments, 1);
  let timerId = setTimeout(function run() {
    vk_api.messages.setActivity.apply(null, args);
    //messages.setActivity(false, 136914440, true);
    //messages.setActivity(true, 269607362, true);
    timerId = setTimeout(run, 4500);
  }, 4500);

  setTimeout(() => {
    clearInterval(timerId);
  }, endTime);
}