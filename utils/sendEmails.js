import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  // 1. สร้าง Transporter (ตัวกลางสำหรับส่ง) โดยใช้ข้อมูลจาก .env
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // 2. กำหนดรายละเอียดของอีเมล
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: options.email,
    subject: options.subject,
    text: options.message, // เนื้อหาแบบ text ธรรมดา
    html: options.html,    // เนื้อหาแบบ HTML
  };

  // 3. ส่งอีเมล
  await transporter.sendMail(mailOptions);
};

export default sendEmail;
