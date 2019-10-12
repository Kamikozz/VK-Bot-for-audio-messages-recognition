const https = require('https');
const http = require('http');
const fs = require('fs');

const server = http.createServer(function (req, res) {
  const ip = req.socket.remoteAddress;
  const port = req.socket.remotePort;
  console.error(`Connection established from: ${ip}:${port}. To:${req.url}`);
  // res.writeHead(200, { 'Content-Type': 'text/plain' });
  switch (req.url) {
    case "/":
      res.end(`<div><div>Your IP address is <h4 style="display: inline; color:#FF0000">${ip}</h4></div><div>Your source port is <h4 style="display: inline; color:#FF0000">${port}</h4></div></div>`);
      break;
    case "/callback":
      if (req.method === 'POST') {
        const type = req.headers['content-type'];
        let data = '';
        req.on('data', (chunk) => { data += chunk; });
        req.on('end', () => {
          if (type && type.indexOf('application/json') !== -1) {
            console.error('Got: "application/json"');
            let parsed;
            try {
              parsed = JSON.parse(data);
            } catch (error) {
              if (error.name === 'SyntaxError') {
                console.error(error.message);
                res.writeHead(400);
                res.end('error');
                return;
              }
            }
            console.log(parsed);
            if (parsed.type && parsed.type === 'confirmation' &&
              parsed.group_id && parsed.group_id === '--VK_GROUP_ID--') {
              //console.log(req);
              res.writeHead(200);
              res.end('--VK_RESPONSE_KEY--');
              return;
            }

            if (parsed.type && parsed.type === 'message_new') {
              res.writeHead(200);
              res.end('ok');

              //// Send request to test YANDEX.RU
              const options = {
                method: 'GET',
                hostname: 'm.vk.com',
                path: '/',
                // headers: {
                //   'Content-Type': 'application/json',
                //   'Content-Length': data.length
                // }
              }
              https.get(options, (res) => {
                console.log('statusCode:', res.statusCode);
                // console.log('headers:', res.headers);
                let data = '';
                res.on('data', (chunk) => {
                  data += chunk;
                  //process.stdout.write(chunk);
                });
                res.on('end', () => {
                  console.log(data.toString());
                });
              }).on('error', (e) => {
                console.error(e.message);
              });
            }
          } else {
            console.log(data.toString());
          }
          res.writeHead(200);
          res.end('ok');
        });
      } else {
        // if not POST
        res.writeHead(405);
        res.end('error');
      }
      break;
    default:
      const txt = '404 not found';
      res.writeHead(404, {
        'Content-Type': 'text/html; charset=UTF-8',
        'Content-Length': Buffer.byteLength(txt)
      });
      res.end(txt);
      break;
  }
}).listen(process.env.PORT || 5000);