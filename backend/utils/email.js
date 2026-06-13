const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const sendPasswordResetEmail = async (email, resetToken, userName) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  const mailOptions = {
    from: `"MediTracker" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset Request - MediTracker',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #1a2980, #26d0ce); padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0;">🏥 MediTracker</h1>
        </div>
        <h2 style="color: #333;">Hello ${userName},</h2>
        <p style="color: #666; line-height: 1.6;">You requested a password reset for your MediTracker account. Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #1a2980, #26d0ce); color: white; padding: 14px 30px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #999; font-size: 14px;">This link expires in <strong>10 minutes</strong>.</p>
        <p style="color: #999; font-size: 14px;">If you didn't request this, please ignore this email. Your account remains secure.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #bbb; font-size: 12px; text-align: center;">MediTracker - Your Health Management Partner</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendWelcomeEmail = async (email, userName, role) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: `"MediTracker" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to MediTracker!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #1a2980, #26d0ce); padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0;">🏥 MediTracker</h1>
        </div>
        <h2 style="color: #333;">Welcome, ${userName}! 🎉</h2>
        <p style="color: #666; line-height: 1.6;">Your account has been successfully created as a <strong>${role}</strong>.</p>
        <p style="color: #666; line-height: 1.6;">MediTracker helps you manage medications, set reminders, and track health progress efficiently.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/login" style="background: linear-gradient(135deg, #1a2980, #26d0ce); color: white; padding: 14px 30px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold;">Login Now</a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #bbb; font-size: 12px; text-align: center;">MediTracker - Your Health Management Partner</p>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail, sendWelcomeEmail };
