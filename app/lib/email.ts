// app/lib/email.ts
import nodemailer from "nodemailer";

interface Course {
  mainTitle: string;
}

export async function sendWelcomeEmail(
  userId: string,
  email: string,
  password: string,
  courses: Course[]
) {
  // Validate required parameters
  if (!userId) throw new Error("userId is required for sending welcome email");
  if (!email) throw new Error("email is required for sending welcome email");

  // Configure email transport (adjust based on your email provider)
  const transporter = nodemailer.createTransport({
    // Configure your email provider details here
    // Example for Gmail:
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Create a list of enrolled courses
  const coursesList = courses
    .map((course) => `- ${course.mainTitle}`)
    .join("\n");

  // Configure email content
  const mailOptions = {
    from: process.env.EMAIL_FROM || "noreply@yourcompany.com",
    to: email,
    subject: "Welcome to Our Learning Platform",
    text: `
Hello,

Thank you for joining our learning platform! Here are your account details:

Email: ${email}
Password: ${password}

You have been enrolled in the following courses:
${coursesList}

Please login at ${
      process.env.NEXT_PUBLIC_APP_URL || "https://yourapp.com"
    } to access your courses.

Note: You may want to change your password after the first login for security.

Best regards,
Your Learning Platform Team
    `,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to Our Learning Platform!</h2>
      <p>Thank you for joining our learning platform! Here are your account details:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
      </div>
      <p>You have been enrolled in the following courses:</p>
      <ul>
        ${courses.map((course) => `<li>${course.mainTitle}</li>`).join("")}
      </ul>
      <p>Please <a href="${
        process.env.NEXT_PUBLIC_APP_URL || "https://yourapp.com"
      }">login to your account</a> to access your courses.</p>
      <p><em>Note: You may want to change your password after the first login for security.</em></p>
      <p>Best regards,<br>Your Learning Platform Team</p>
    </div>
    `,
  };

  // Send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw error; // Re-throw to be handled by caller
  }
}
