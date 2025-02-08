// app/api/auth/login/route.ts
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { NextResponse } from "next/server";
import { app } from "@/app/firebase/firebase-config";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const auth = getAuth(app);
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Generate session token
    const token = await user.getIdToken();

    // Return success response with user data and token
    return NextResponse.json(
      {
        message: "Login successful",
        token,
        user: {
          uid: user.uid,
          email: user.email,
        },
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": `auth-token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict`,
        },
      }
    );
  } catch (error: unknown) {
    console.error("Login error:", error);

    // Handle specific Firebase auth errors
    const errorCode = (error as { code: string }).code;
    let errorMessage = "An error occurred during login";

    switch (errorCode) {
      case "auth/user-not-found":
        errorMessage = "No user found with this email";
        break;
      case "auth/wrong-password":
        errorMessage = "Invalid password";
        break;
      case "auth/invalid-email":
        errorMessage = "Invalid email address";
        break;
      case "auth/user-disabled":
        errorMessage = "This account has been disabled";
        break;
    }

    return NextResponse.json({ error: errorMessage }, { status: 401 });
  }
}
