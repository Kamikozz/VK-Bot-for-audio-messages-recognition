const http = require('http');

const port = 3000;
const host = "localhost";

const server = http.createServer((req, res) => {
  const ip = req.socket.remoteAddress;
  const port = req.socket.remotePort;
  console.error(`Connection established from: ${ip}:${port}. To:${req.url}`);

  switch (req.url) {
    case "/":
      res.end(`<div><div>Your IP address is <h4 style="display: inline; color:#FF0000">${ip}</h4></div><div>Your source port is <h4 style="display: inline; color:#FF0000">${port}</h4></div></div>`);
      break;
    case "/callback":
      if (req.method === 'POST') {
        const type = req.headers['content-type'];
        let data = '';
        req.on('data', (chunk) => { data = chunk; });
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
              console.log(req);
              res.writeHead(200);
              res.end('--VK_RESPONSE_KEY--');
              return;
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
}).listen(port);

console.error(`Server listens http://${host}:${port}`);