// app/lib/email.ts
import nodemailer from "nodemailer";

// Configure transport
const transporter = nodemailer.createTransport({
  service: "gmail", // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD, // Use app-specific password
  },
});

// Email template function
export const generateWelcomeEmail = (
  email: string,
  password: string,
  courses: { mainTitle: string }[]
) => {
  const coursesList = courses.map((course) => course.mainTitle).join(", ");

  return {
    subject: "Welcome to Edzeeta - Your Course Registration is Complete",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #004aad;
              color: white;
              padding: 20px;
              text-align: center;
            }
            .content {
              padding: 20px;
              background-color: #f8f9fa;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #6c757d;
              font-size: 14px;
            }
            .details {
              background-color: white;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .detail-item {
              margin: 10px 0;
            }
            .highlight {
              color: #004aad;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Edzeeta</h1>
            </div>
            <div class="content">
              <p>Thank you for choosing Edzeeta!</p>
              <p>Your course enrollment is complete.</p>
              
              <div class="details">
                <h2 style="color: #004aad;">Login Details</h2>
                <div class="detail-item">
                  <strong>Email:</strong> ${email}
                </div>
                <div class="detail-item">
                  <strong>Password:</strong> ${password}
                </div>
                <div class="detail-item">
                  <strong>Courses Registered:</strong> ${coursesList}
                </div>
              </div>
              
              <p>You can now access your courses through our LMS platform.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Edzeeta. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
};

// Send email function
export const sendWelcomeEmail = async (
  email: string,
  password: string,
  courses: { mainTitle: string }[]
) => {
  const { subject, html } = generateWelcomeEmail(email, password, courses);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
};
