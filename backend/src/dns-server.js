/**
 * DNS Server nội bộ cho casictask.local
 *
 * Chạy trên port 5353 (không cần quyền admin, không xung đột Windows DNS)
 *
 * Cách dùng:
 *   Cấu hình router DHCP → DNS Server = IP máy chủ, DNS Port = 5353
 *   HOẶC cấu hình từng máy: DNS Server = IP máy chủ (nếu router hỗ trợ custom port)
 *
 * Nếu router không hỗ trợ custom DNS port:
 *   Dùng script setup-hosts-cert.ps1 trên từng máy (1 lần duy nhất)
 */
const { UDPServer, UDPClient, Packet } = require('dns2');
const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const LOCAL_IP   = process.env.SERVER_IP  || getLocalIP();
const DNS_DOMAIN = process.env.DNS_DOMAIN || 'casictask.local';
const DNS_PORT   = parseInt(process.env.DNS_PORT) || 5454;

const LOCAL_RECORDS = {
  [DNS_DOMAIN]:          LOCAL_IP,
  [`www.${DNS_DOMAIN}`]: LOCAL_IP,
};

const upstreamResolve = UDPClient({ dns: '8.8.8.8' });

function startDNS() {
  const server = new UDPServer(async (request, send) => {
    const response = Packet.createResponseFromRequest(request);
    const question = request.questions[0];
    if (!question) { send(response); return; }

    const name = question.name.toLowerCase();

    // Domain nội bộ
    if (LOCAL_RECORDS[name]) {
      response.answers.push({
        name,
        type:    Packet.TYPE.A,
        class:   Packet.CLASS.IN,
        ttl:     300,
        address: LOCAL_RECORDS[name],
      });
      send(response);
      return;
    }

    // Forward lên Google DNS
    try {
      const upstream = await upstreamResolve(name, 'A');
      if (upstream?.answers) response.answers = upstream.answers;
    } catch {}
    send(response);
  });

  server.on('listening', () => {
    console.log(`✅ DNS server chạy tại port ${DNS_PORT} (UDP)`);
    console.log(`   ${DNS_DOMAIN} → ${LOCAL_IP}`);
    if (DNS_PORT === 53) {
      console.log(`\n   📡 Cấu hình router DHCP: DNS Server = ${LOCAL_IP}`);
    } else {
      console.log(`\n   📡 Cấu hình router DHCP: DNS Server = ${LOCAL_IP}, Port = ${DNS_PORT}`);
      console.log(`   Hoặc chạy setup-hosts-cert.ps1 trên từng máy nhân viên (1 lần)`);
    }
    console.log(`   Nhân viên gõ: https://${DNS_DOMAIN}\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`\n⚠️  Port ${DNS_PORT} đang bị chiếm — DNS server không khởi động`);
    } else if (err.code === 'EACCES') {
      console.warn(`\n⚠️  Cần quyền Administrator để dùng port ${DNS_PORT}`);
      console.warn('   Chạy start-server.bat bằng "Run as administrator"\n');
    } else {
      console.error('DNS error:', err.code, err.message);
    }
  });

  server.listen(DNS_PORT);
  return server;
}

module.exports = { startDNS, getLocalIP, DNS_DOMAIN, LOCAL_IP };
