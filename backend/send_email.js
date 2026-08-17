const nodemailer = require('./node_modules/nodemailer');
const fs = require('fs');
const path = require('path');

const toEmail = process.argv[2];
const subject = process.argv[3];
const htmlBody = process.argv[4];

if (!toEmail || !subject || !htmlBody) {
  console.error("Missing arguments: node send_email.js <toEmail> <subject> <htmlBody>");
  process.exit(1);
}

// Simple manual parser for .env file
const envPath = path.join(__dirname, '.env');
const env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const idx = line.indexOf('=');
      const key = line.substring(0, idx).trim();
      const val = line.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
      env[key] = val;
    }
  });
}

async function sendMail() {
  let host = env.SMTP_SERVER || 'smtp.ethereal.email';
  let port = parseInt(env.SMTP_PORT || '587');
  let user = env.SMTP_USER;
  let pass = env.SMTP_PASSWORD;
  
  if (!user || !pass || user.startsWith('your_') || user.includes('example.com')) {
    console.log("Using temporary Ethereal sandbox account for testing...");
    let testAccount = await nodemailer.createTestAccount();
    host = 'smtp.ethereal.email';
    port = 587;
    user = testAccount.user;
    pass = testAccount.pass;
    
    // Save to .env
    const newEnv = `SMTP_SERVER=smtp.ethereal.email\nSMTP_PORT=587\nSMTP_USER=${user}\nSMTP_PASSWORD=${pass}\nSENDER_EMAIL=${user}\n`;
    fs.writeFileSync(envPath, newEnv);
  }

  let transportConfig = {
    host: host,
    port: port,
    secure: port === 465,
    auth: {
      user: user,
      pass: pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  };

  if (host.includes('gmail')) {
    transportConfig = {
      service: 'gmail',
      auth: {
        user: user,
        pass: pass,
      },
      tls: {
        rejectUnauthorized: false
      }
    };
  }

  let transporter = nodemailer.createTransport(transportConfig);

  let mailOptions = {
    from: `"PillSync Support" <${env.SENDER_EMAIL || user}>`,
    to: toEmail,
    subject: subject,
    html: htmlBody,
  };

  let info = await transporter.sendMail(mailOptions);
  console.log("Message sent: %s to %s", info.messageId, toEmail);

  try {
    const logEntry = `[${new Date().toISOString()}] TO: ${toEmail} | SUBJECT: ${subject}\n`;
    const logPath = path.join(__dirname, 'dispatched_emails.log');
    fs.appendFileSync(logPath, logEntry);
  } catch (err) {
    // Ignore logging errors
  }
  
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log("Preview URL: %s", previewUrl);
  }
}

sendMail().catch(err => {
  console.error("Nodemailer error:", err);
  process.exit(1);
});
